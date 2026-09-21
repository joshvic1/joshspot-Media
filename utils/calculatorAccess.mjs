export const canAccessCalculator = staff => staff?.admin === true || staff?.role === "ADMIN" || staff?.role === "CSS";

// Roles must come from the authenticated backend session, never browser storage.
export async function verifyCalculatorAccess(token, backendUrl, fetchSession = fetch) {
  if (!token || typeof token !== "string") return 401;
  const response = await fetchSession(`${backendUrl.replace(/\/$/, "")}/crm/session`, {
    headers: { authorization: token }, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401) return 401;
  if (!response.ok) return 502;
  const data = await response.json();
  return canAccessCalculator(data.staff) ? 200 : 403;
}
