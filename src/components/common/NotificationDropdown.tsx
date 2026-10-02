import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, Clock, X } from 'lucide-react';
import { AppNotification } from '../../types';
import { db } from '../../services/db/database';

interface NotificationDropdownProps {
  onSelectNotification?: (notif: AppNotification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onSelectNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, [isOpen]);

  const loadNotifications = async () => {
    const list = await db.getNotifications();
    setNotifications(list);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.markNotificationAsRead(id);
    loadNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        title="System Notifications & Alerts"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 p-3.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Notifications & Reminders
                </span>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                {unreadCount} Unread
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No active notifications or overdue accounts.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (onSelectNotification) onSelectNotification(notif);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-3 p-3 text-xs transition-colors cursor-pointer hover:bg-slate-800/60 ${
                      !notif.is_read ? 'bg-slate-800/30' : 'opacity-70'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.severity === 'danger' || notif.severity === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Info className="h-4 w-4 text-sky-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs leading-tight">{notif.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        title="Mark as Read"
                        className="text-slate-500 hover:text-white p-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
