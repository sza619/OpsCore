import { useAuth } from "../../hooks/useAuth";

export const AuthInitializer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useAuth(); // triggers currentUser query

  return <>{children}</>;
};
