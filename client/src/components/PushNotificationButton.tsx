import React from "react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff } from "lucide-react";

export function PushNotificationButton() {
  const { status, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (status === "unsupported") {
    return null;
  }

  return (
    <Button
      onClick={isSubscribed ? unsubscribe : subscribe}
      className={`gap-2 ${
        isSubscribed
          ? "bg-green-600 hover:bg-green-700"
          : "bg-gray-700 hover:bg-gray-600"
      }`}
      size="sm"
    >
      {isSubscribed ? (
        <>
          <Bell size={16} />
          Notificações Ativas
        </>
      ) : (
        <>
          <BellOff size={16} />
          Ativar Notificações
        </>
      )}
    </Button>
  );
}
