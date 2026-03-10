export function getAvatarStorageKey(params: {
  userId: string | null;
  email: string | null;
  fullName: string;
}) {
  const identity = params.userId ?? params.email ?? params.fullName;
  return identity ? `basket-production-avatar:${identity}` : null;
}

export const AVATAR_CHANGE_EVENT = "basket-production-avatar-changed";
