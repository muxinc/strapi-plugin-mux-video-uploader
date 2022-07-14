import { Duration } from "luxon";

const secondsToFormattedString = (seconds:number) => {
  const date = Duration.fromMillis(seconds * 1000);
  const parts = date.shiftTo('hours', 'minutes', 'seconds').toObject();
  
  const secs = parts.seconds && Math.round(parts.seconds).toString().padStart(2, '0');

  if (parts.hours === 0) {
    return `${parts.minutes}:${secs}`;
  }
  else {
    const mins = parts.minutes?.toString().padStart(2, '0');
    return `${parts.hours}:${mins}:${secs}`;
  }
};

export {
  secondsToFormattedString
};
