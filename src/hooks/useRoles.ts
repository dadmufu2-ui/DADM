import { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { UserRole } from "@/contexts/AuthContext";

export interface UserProfile {
  id: string; // the uid
  email: string;
  role: UserRole;
}

export function useRoles() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rolesRef = ref(database, 'roles');
    const unsubscribe = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as UserProfile[];
        setUsers(parsedData);
      } else {
        setUsers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const changeUserRole = async (uid: string, email: string, newRole: UserRole) => {
    const roleRef = ref(database, `roles/${uid}`);
    await set(roleRef, { email, role: newRole });
  };

  const deleteUserRecord = async (uid: string) => {
    const roleRef = ref(database, `roles/${uid}`);
    await remove(roleRef);
  };

  return { users, loading, changeUserRole, deleteUserRecord };
}
