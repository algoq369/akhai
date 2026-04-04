// Extract meaningful topic from query text
export const extractTopic = (queryText: string): string => {
  const text = queryText.trim();

  const quotedMatch = text.match(/about\s+[\"']([^\"']+)[\"']/i);
  if (quotedMatch && quotedMatch[1].length > 2) {
    return quotedMatch[1].trim();
  }

  const aboutMatch = text.match(/about\s+(.+?)(?:\?|\.|\!|$)/i);
  if (aboutMatch && aboutMatch[1].length > 3) {
    let topic = aboutMatch[1].trim();
    topic = topic.replace(/\s+(please|thanks|thank you|now|today|quickly|briefly)$/i, '');
    if (topic.length > 3) return topic;
  }

  const whatIsMatch = text.match(
    /(?:what\s+(?:is|are)|explain|define|describe|tell\s+me\s+about)\s+(.+?)(?:\?|\.|\!|$)/i
  );
  if (whatIsMatch && whatIsMatch[1].length > 2) {
    let topic = whatIsMatch[1].trim();
    topic = topic.replace(/^(?:the|a|an)\s+/i, '');
    if (topic.length > 2) return topic;
  }

  const howMatch = text.match(/how\s+(?:does|do|can|to)\s+(.+?)(?:\?|\.|\!|$)/i);
  if (howMatch && howMatch[1].length > 3) {
    return howMatch[1].trim();
  }

  const skipPrefixes = [
    'give',
    'exactly',
    'brief',
    'insights',
    'provide',
    'list',
    'show',
    'tell',
    'please',
    'could',
    'would',
    'should',
    'can',
    'will',
    'help',
    'need',
    'want',
    'looking',
    'find',
    'search',
    'write',
    'create',
    'make',
    'generate',
    'some',
    'few',
    'many',
    'several',
    'number',
    'numbers',
    'digit',
    'digits',
  ];
  const skipWords = [
    'what',
    'how',
    'why',
    'when',
    'where',
    'which',
    'that',
    'this',
    'with',
    'from',
    'about',
    'would',
    'could',
    'should',
    'have',
    'been',
    'were',
    'your',
    'them',
    'they',
    'will',
    'more',
    'some',
    'the',
    'and',
    'for',
    'are',
    'was',
    'is',
    'be',
    'has',
    'had',
    'not',
    'but',
    'or',
    'if',
    'so',
    'me',
    'my',
    'you',
    'we',
    'our',
    'its',
    'their',
    'there',
    'here',
    'just',
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !skipPrefixes.includes(w) && !skipWords.includes(w));

  if (words.length > 0) {
    return words.slice(0, 4).join(' ');
  }

  return 'General';
};

// Normalize topic for grouping
export const normalizeTopic = (topic: string): string => {
  return topic
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
};

export const formatDate = (timestamp: number) => {
  const d = new Date(timestamp * 1000);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatTime = (timestamp: number) => {
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
