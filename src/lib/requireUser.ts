import { redirect } from 'next/navigation';

import { getOptionalUser, type SessionUser } from '@/lib/currentUser';

export const requireCurrentUser = async (): Promise<SessionUser> => {
  const user = await getOptionalUser();
  if (!user) {
    redirect('/login');
  }
  return user;
};

export const requireUser = async (): Promise<string> => {
  const user = await requireCurrentUser();
  return user.id;
};
