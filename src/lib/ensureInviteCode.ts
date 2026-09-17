import { prisma } from '@/lib/db';
import { generateInviteCode } from '@/lib/generateInviteCode';

export const ensureInviteCode = async (userId: string): Promise<string> => {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true },
  });
  if (current?.inviteCode) {
    return current.inviteCode;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteCode = generateInviteCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { inviteCode } });
      return inviteCode;
    } catch {
      const raced = await prisma.user.findUnique({
        where: { id: userId },
        select: { inviteCode: true },
      });
      if (raced?.inviteCode) {
        return raced.inviteCode;
      }
    }
  }

  return generateInviteCode();
};
