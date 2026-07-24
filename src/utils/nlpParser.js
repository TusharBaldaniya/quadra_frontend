// Smart Natural Language Task Parser for Quadra

export function parseNaturalLanguageTask(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return {
      title: '',
      quadrant: null,
      tags: [],
      due: null,
      timeStr: null
    };
  }

  let text = rawTitle;
  let quadrant = null;
  let tags = [];
  let due = null;
  let timeStr = null;

  // 1. Quadrant Flags: !q1, !q2, !q3, !q4 or !do, !schedule, !delegate, !eliminate
  const quadMatch = text.match(/!(q[1-4]|do|schedule|delegate|eliminate)/i);
  if (quadMatch) {
    const flag = quadMatch[1].toLowerCase();
    if (flag === 'q1' || flag === 'do') quadrant = 'q1';
    else if (flag === 'q2' || flag === 'schedule') quadrant = 'q2';
    else if (flag === 'q3' || flag === 'delegate') quadrant = 'q3';
    else if (flag === 'q4' || flag === 'eliminate') quadrant = 'q4';

    text = text.replace(quadMatch[0], '').trim();
  }

  // 2. Hashtags: #work #personal #urgent
  const tagMatches = text.match(/#([\w-]+)/g);
  if (tagMatches) {
    tags = tagMatches.map(t => t.slice(1));
    text = text.replace(/#([\w-]+)/g, '').trim();
  }

  // 3. Time & Date Keywords
  const now = new Date();
  const lowerText = text.toLowerCase();

  // Pattern A: "tomorrow at 3pm" or "tomorrow at 15:00" or "tomorrow"
  const tomorrowMatch = lowerText.match(/\btomorrow(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i);
  if (tomorrowMatch) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + 1);
    
    let hours = 9; // Default 9 AM tomorrow
    let minutes = 0;

    if (tomorrowMatch[1]) {
      hours = parseInt(tomorrowMatch[1], 10);
      const isPm = tomorrowMatch[3] && tomorrowMatch[3].toLowerCase() === 'pm';
      const isAm = tomorrowMatch[3] && tomorrowMatch[3].toLowerCase() === 'am';

      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
      if (tomorrowMatch[2]) minutes = parseInt(tomorrowMatch[2], 10);
    }
    
    targetDate.setHours(hours, minutes, 0, 0);
    due = targetDate.toISOString();
    timeStr = `Tomorrow at ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    text = text.replace(/tomorrow(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/gi, '').trim();
  } 
  // Pattern B: "today at 3pm" or "today at 15:00" or "at 3pm" / "at 14:00"
  else {
    const todayMatch = lowerText.match(/(?:\btoday\s+)?at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (todayMatch) {
      const targetDate = new Date(now);
      let hours = parseInt(todayMatch[1], 10);
      let minutes = 0;
      const isPm = todayMatch[3] && todayMatch[3].toLowerCase() === 'pm';
      const isAm = todayMatch[3] && todayMatch[3].toLowerCase() === 'am';

      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
      if (todayMatch[2]) minutes = parseInt(todayMatch[2], 10);

      targetDate.setHours(hours, minutes, 0, 0);

      // If time has passed today, move to tomorrow
      if (targetDate < now && !lowerText.includes('today')) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      due = targetDate.toISOString();
      timeStr = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      text = text.replace(/(?:\btoday\s+)?at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, '').trim();
    }
  }

  // Clean trailing spaces & double spaces
  const cleanTitle = text.replace(/\s+/g, ' ').trim();

  return {
    title: cleanTitle || rawTitle,
    quadrant,
    tags,
    due,
    timeStr
  };
}
