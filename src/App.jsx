import { useQuery } from '@tanstack/react-query';
import UserCard from './UserCard.jsx';

export default function App() {
  const { data: users, isPending, error } = useQuery({
    queryKey: ['users'],
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/users', { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  if (isPending) return <main><UserCard loading /></main>;
  if (error) return <main><p role="alert">Couldn't load the team: {error.message}</p></main>;

  return (
    <main>
      <h1>Team</h1>
      <p className="count">{users.length} people</p>
      <ul className="team">
        {users.map((user) => (
          <li key={user.id}>
            <UserCard user={user} />
          </li>
        ))}
      </ul>
    </main>
  );
}
