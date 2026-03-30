import { Outlet } from 'react-router';

export function Root() {
  return (
    <div className="size-full overflow-y-auto overflow-x-hidden">
      <Outlet />
    </div>
  );
}
