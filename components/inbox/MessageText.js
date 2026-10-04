export default function MessageText({ children }) {
  if (Array.isArray(children)) return children.map((part, index) => <MessageText key={index}>{part}</MessageText>);
  if (typeof children !== 'string') return children;
  return children.split(/((?:https?:\/\/|www\.)[^\s<>]+)/gi).map((part, index) => {
    if (!/^(https?:\/\/|www\.)/i.test(part)) return part;
    const url = part.replace(/[.,!?;:)]+$/, '');
    return <span key={index}><a href={/^www\./i.test(url) ? `https://${url}` : url} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>{url}</a>{part.slice(url.length)}</span>;
  });
}
