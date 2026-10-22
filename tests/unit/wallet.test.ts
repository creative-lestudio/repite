import { execFileSync } from "node:child_process";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  hexToRgb,
  parseSerial,
  passSerial,
  proximityText,
  stampRow,
  statusLine,
  type PassContent,
} from "@/domain/wallet";

vi.mock("server-only", () => ({}));

const LOC = "a0000000-0000-4000-8000-0000000000a1";
const CUS = "a0000000-0000-4000-8000-0000000000e1";

const content: PassContent = {
  serial: passSerial(LOC, CUS),
  locationName: "Café Aurora",
  customerName: "María",
  rewardName: "Un café gratis",
  total: 8,
  filled: 3,
  rewardsReady: 0,
  qrUrl: "https://repite.example/equipo/q/abc",
  brandColor: "#FF3B2E",
};

describe("dominio de Wallet", () => {
  it("dibuja los sellos y acorta cuando son muchos", () => {
    expect(stampRow(3, 8)).toBe("●●●○○○○○");
    expect(stampRow(20, 8)).toBe("●●●●●●●●");
    expect(stampRow(7, 15)).toBe("7 / 15");
  });

  it("ida y vuelta del número de serie, y rechaza basura", () => {
    expect(parseSerial(passSerial(LOC, CUS))).toEqual({ locationId: LOC, customerId: CUS });
    expect(parseSerial("../etc/passwd")).toBeNull();
  });

  it("estado: sellos que faltan o premio listo", () => {
    expect(statusLine(content)).toBe("Te faltan 5 sellos");
    expect(statusLine({ ...content, filled: 7 })).toBe("Te falta 1 sello");
    expect(statusLine({ ...content, rewardsReady: 1 })).toBe("¡Premio listo!");
  });

  it("el aviso por cercanía menciona el premio, el cupón o los sellos que faltan", () => {
    expect(proximityText({ ...content })).toBe("Estás cerca de Café Aurora: te faltan 5 sellos.");
    expect(proximityText({ ...content, couponsReady: 1 })).toContain("cupón");
    expect(proximityText({ ...content, rewardsReady: 1 })).toContain("premio");
  });

  it("convierte colores hex y cae al rojo de marca si son inválidos", () => {
    expect(hexToRgb("#FF3B2E")).toBe("rgb(255, 59, 46)");
    expect(hexToRgb("rojo")).toBe("rgb(255, 59, 46)");
  });
});

describe("Google Wallet", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

  beforeAll(() => {
    Object.assign(process.env, {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "x",
      SUPABASE_SERVICE_ROLE_KEY: "x",
      SESSION_SECRET: "s".repeat(40),
      NEXT_PUBLIC_APP_URL: "https://repite.example",
      GOOGLE_WALLET_ISSUER_ID: "3388000000000000001",
      GOOGLE_WALLET_SERVICE_ACCOUNT: Buffer.from(
        JSON.stringify({
          client_email: "wallet@proyecto.iam.gserviceaccount.com",
          private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
        }),
      ).toString("base64"),
    });
  });

  it("el enlace de guardado lleva un JWT firmado con la clase y el objeto de la tarjeta", async () => {
    const { googleSaveUrl } = await import("@/server/wallet/google");
    const url = googleSaveUrl(content, LOC);
    expect(url.startsWith("https://pay.google.com/gp/v/save/")).toBe(true);
    const [h, b, sig] = url.replace("https://pay.google.com/gp/v/save/", "").split(".");
    const ok = createVerify("RSA-SHA256").update(`${h}.${b}`).verify(publicKey, Buffer.from(sig!, "base64url"));
    expect(ok).toBe(true);
    const claims = JSON.parse(Buffer.from(b!, "base64url").toString());
    expect(claims).toMatchObject({
      aud: "google",
      typ: "savetowallet",
      iss: "wallet@proyecto.iam.gserviceaccount.com",
    });
    const obj = claims.payload.loyaltyObjects[0];
    expect(obj.loyaltyPoints.balance.string).toBe("3/8");
    expect(obj.barcode.value).toBe(content.qrUrl);
    expect(obj.classId).toBe(claims.payload.loyaltyClasses[0].id);
    expect(obj.id.startsWith("3388000000000000001.")).toBe(true);
    expect(obj.locations).toBeUndefined();

    const withCoords = googleSaveUrl({ ...content, coords: { latitude: 40.4168, longitude: -3.7038 } }, LOC);
    const claims2 = JSON.parse(Buffer.from(withCoords.split("/save/")[1]!.split(".")[1]!, "base64url").toString());
    expect(claims2.payload.loyaltyObjects[0].locations).toEqual([{ latitude: 40.4168, longitude: -3.7038 }]);
  });
});

describe("Apple Wallet", () => {
  it("genera un .pkpass firmado y valida el token de actualización", async () => {
    const dir = mkdtempSync(join(tmpdir(), "wallet-"));
    const cert = (name: string) => {
      execFileSync(
        "openssl",
        [
          "req",
          "-x509",
          "-newkey",
          "rsa:2048",
          "-nodes",
          "-keyout",
          `${dir}/${name}.key`,
          "-out",
          `${dir}/${name}.crt`,
          "-days",
          "2",
          "-subj",
          `/CN=${name}`,
        ],
        { stdio: "ignore" },
      );
      return [readFileSync(`${dir}/${name}.crt`), readFileSync(`${dir}/${name}.key`)] as const;
    };
    const [signerCert, signerKey] = cert("signer");
    const [wwdr] = cert("wwdr");
    const { buildApplePass, appleAuthToken, isValidAppleAuth } = await import("@/server/wallet/apple");
    const buf = await buildApplePass(content, {
      passTypeId: "pass.app.repite.test",
      teamId: "TEAM123456",
      cert: signerCert.toString(),
      key: signerKey.toString(),
      wwdr: wwdr.toString(),
    });
    const text = buf.toString("latin1");
    for (const file of ["pass.json", "manifest.json", "signature", "icon.png", "logo@2x.png"]) {
      expect(text).toContain(file);
    }
    const token = appleAuthToken(content.serial);
    expect(isValidAppleAuth(`ApplePass ${token}`, content.serial)).toBe(true);
    expect(isValidAppleAuth(`ApplePass ${token}x`, content.serial)).toBe(false);
    expect(isValidAppleAuth(null, content.serial)).toBe(false);
  });
});
