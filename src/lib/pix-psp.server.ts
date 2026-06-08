// Consulta universal de PIX dinâmico — extrai a Location do "copia e cola",
// chama o PSP, decodifica o JWS e devolve o status.
// Roda apenas no servidor (usado por server functions).

function parseTLV(payload: string) {
  let i = 0;
  const fields: { id: string; len: number; value: string }[] = [];
  while (i < payload.length - 4) {
    const id = payload.slice(i, i + 2);
    const len = parseInt(payload.slice(i + 2, i + 4), 10);
    if (!Number.isFinite(len)) break;
    const value = payload.slice(i + 4, i + 4 + len);
    fields.push({ id, len, value });
    i += 4 + len;
  }
  return fields;
}

export function extrairLocationPix(pix: string): string | null {
  const campos = parseTLV(pix);
  const campo26 = campos.find((c) => c.id === "26");
  if (!campo26) return null;
  const subcampos = parseTLV(campo26.value);
  const campo25 = subcampos.find((c) => c.id === "25");
  if (!campo25) return null;
  const location = campo25.value;
  return location.startsWith("http") ? location : `https://${location}`;
}

function identificarProvedor(location: string) {
  const loc = location.toLowerCase();
  if (loc.includes("ebanx")) return "EBANX";
  if (loc.includes("itau")) return "ITAU";
  if (loc.includes("dlocal")) return "DLOCAL";
  if (loc.includes("stone") || loc.includes("pagar.me")) return "STONE_PAGARME";
  return "DESCONHECIDO";
}

function decodificarJWS(jws: string): any | null {
  try {
    const clean = jws.trim().replace(/%$/, "");
    const partes = clean.split(".");
    if (partes.length !== 3) return null;
    const payloadBase64 = partes[1];
    // base64url -> base64
    const b64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      "="
    );
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export type PixStatusResult = {
  status: string; // ATIVA | CONCLUIDA | REMOVIDA_PELO_USUARIO_RECEBEDOR | REMOVIDA_PELO_PSP | INDISPONIVEL | NAO_ENCONTRADA | SEM_LOCATION | ERRO | DESCONHECIDO
  httpStatus?: number;
  provider?: string;
  location?: string;
  txid?: string;
  valor?: string;
  criacao?: string;
  expiracao?: string;
  mensagem?: string;
};

export async function consultarPix(pix: string): Promise<PixStatusResult> {
  const location = extrairLocationPix(pix);
  if (!location) {
    return { status: "SEM_LOCATION", mensagem: "Pix sem Location dinâmica." };
  }
  const provider = identificarProvedor(location);

  let response: Response;
  try {
    response = await fetch(location, {
      headers: { Accept: "application/jose, application/json, */*" },
    });
  } catch (e: any) {
    return { status: "ERRO", provider, location, mensagem: e?.message || "fetch failed" };
  }
  const body = await response.text();

  if (response.status === 410) {
    return { status: "INDISPONIVEL", httpStatus: 410, provider, location, mensagem: "Cobrança indisponível." };
  }
  if (response.status === 404) {
    return { status: "NAO_ENCONTRADA", httpStatus: 404, provider, location, mensagem: "Cobrança não encontrada." };
  }
  if (response.status === 200) {
    const payload = decodificarJWS(body) ?? (() => { try { return JSON.parse(body); } catch { return null; } })();
    return {
      status: payload?.status || "DESCONHECIDO",
      httpStatus: 200,
      provider,
      location,
      txid: payload?.txid,
      valor: payload?.valor?.original,
      criacao: payload?.calendario?.criacao,
      expiracao: payload?.calendario?.expiracao,
    };
  }
  return { status: "ERRO", httpStatus: response.status, provider, location, mensagem: "Falha ao consultar." };
}
