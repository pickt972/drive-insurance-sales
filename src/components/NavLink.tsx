import { NavLink as RouterNavLink, NavLinkProps } from 'react-router-dom';

export function NavLink(props: NavLinkProps) {
  return <RouterNavLink {...props} />;
}
