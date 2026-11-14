export function canAccessInbox(staff) {
  if (staff?.admin) return true;
  if (["SS", "CSS"].includes(staff?.role)) return staff?.permissions?.inboxAccess !== false;
  return staff?.role === "SES" && staff?.permissions?.inboxAccess === true;
}
