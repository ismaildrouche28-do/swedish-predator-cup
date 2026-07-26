"use client";
import { useTransition } from "react";
import { toggleAdmin, deleteUser } from "./actions";

export function AdminUserActions({ userId, isAdmin, isActive }: { userId: string; isAdmin: boolean; isActive: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <button onClick={() => start(() => toggleAdmin(userId, !isAdmin).then())} disabled={pending}
        className="text-[11.5px] px-2 py-1 rounded bg-white text-spc-mid font-semibold hover:bg-spc-lighter">
        {isAdmin ? "Admin entfernen" : "Admin machen"}
      </button>
      {isActive && (
        <button onClick={() => start(() => deleteUser(userId).then())} disabled={pending}
          className="text-[11.5px] px-2 py-1 rounded bg-white text-danger font-semibold hover:bg-danger/10">
          deaktivieren
        </button>
      )}
    </div>
  );
}
