import { useBoardStore } from '../store/boardStore';

export default function OnlineMembers() {
  const onlineMembers = useBoardStore((s) => s.onlineMembers);

  if (onlineMembers.length === 0) return null;

  return (
    <div className="online-members">
      {onlineMembers.slice(0, 5).map((member) => (
        <div key={member.userId} className="online-avatar" title={member.userId}>
          {member.userId.slice(0, 2).toUpperCase()}
        </div>
      ))}
      {onlineMembers.length > 5 && (
        <span className="online-count">+{onlineMembers.length - 5}</span>
      )}
    </div>
  );
}
