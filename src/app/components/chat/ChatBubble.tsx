import { useEffect, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

export function ChatBubble() {
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
    });

    return () => unsub();
  }, []);

  if (!authResolved) return null;

  return <ChatWindow userEmail={user?.email ?? null} />;
}
