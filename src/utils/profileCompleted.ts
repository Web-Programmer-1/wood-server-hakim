export function calculateProfileCompleted(profile: any): number {
  let score = 0;

  if (profile.avatarUri) score += 20;
  if (profile.bio) score += 10;
  if (profile.gender) score += 10;
  if (profile.profession) score += 20;
  if (profile.occupationType) score += 10;
  if (profile.socialLinks) score += 10;
  if (profile.nationalId) score += 20;

  return Math.min(score, 100);
}
