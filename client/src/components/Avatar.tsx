import { useState } from 'react';
import type { User } from '../types';
export function Avatar({
  user,
  size = 'small',
}: {
  user: Pick<User, 'name' | 'avatarUrl'>;
  size?: 'small' | 'large';
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`avatar ${size}`} aria-label={user.name}>
      {user.avatarUrl && !failed ? (
        <img src={user.avatarUrl} alt='' onError={() => setFailed(true)} />
      ) : (
        user.name
          .split(' ')
          .map((s) => s[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      )}
    </span>
  );
}
