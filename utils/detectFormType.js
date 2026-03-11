export function normaliseText(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text, keywords = []) {
  return keywords.some((keyword) => text.includes(keyword));
}

function countMatches(text, keywords = []) {
  return keywords.reduce((count, keyword) => {
    return count + (text.includes(keyword) ? 1 : 0);
  }, 0);
}

export function detectFormType({ filename = "", documentText = "" } = {}) {
  const file = normaliseText(filename);
  const doc = normaliseText(documentText);
  const combined = `${file} ${doc}`.trim();

  const dismissalTitleKeywords = [
    "academic dismissal appeal form",
    "dismissal appeal form",
    "appeal after academic dismissal"
  ];

  const dismissalCodeKeywords = [
    "rof-05",
    "rof 05"
  ];

  const dismissalFieldKeywords = [
    "reason for appeal",
    "academic advisor",
    "semester results",
    "supporting documents",
    "supporting evidence",
    "academic plan",
    "dismissal",
    "appeal",
    "faculty academic office"
  ];

  const withdrawalTitleKeywords = [
    "course withdrawal form",
    "withdrawal from course",
    "withdrawal from course or courses"
  ];

  const withdrawalFieldKeywords = [
    "reason for withdrawal",
    "course code",
    "course title",
    "w grade",
    "withdrawal",
    "subject withdrawal"
  ];

  const postponementTitleKeywords = [
    "application for postponement of studies",
    "postponement of studies",
    "deferment of studies",
    "application for deferment"
  ];

  const postponementFieldKeywords = [
    "reason for postponement",
    "reason for deferment",
    "semester to postpone",
    "semester to defer",
    "postponement",
    "deferment",
    "dean approval",
    "vice president academic"
  ];

  const genericFormKeywords = [
    "student id",
    "signature",
    "date",
    "programme",
    "faculty",
    "form"
  ];

  const dismissalScore =
    countMatches(combined, dismissalTitleKeywords) * 4 +
    countMatches(combined, dismissalCodeKeywords) * 5 +
    countMatches(combined, dismissalFieldKeywords) * 2;

  const withdrawalScore =
    countMatches(combined, withdrawalTitleKeywords) * 4 +
    countMatches(combined, withdrawalFieldKeywords) * 2;

  const postponementScore =
    countMatches(combined, postponementTitleKeywords) * 4 +
    countMatches(combined, postponementFieldKeywords) * 2;

  const genericFormScore = countMatches(combined, genericFormKeywords);

  let result = {
    formType: "unknown_form",
    confidence: 0.35,
    signals: []
  };

  if (dismissalScore >= 5 && dismissalScore >= withdrawalScore && dismissalScore >= postponementScore) {
    result = {
      formType: "academic_dismissal_appeal",
      confidence: dismissalScore >= 9 ? 0.92 : 0.78,
      signals: []
    };

    if (containsAny(combined, dismissalTitleKeywords)) {
      result.signals.push("dismissal appeal title detected");
    }
    if (containsAny(combined, dismissalCodeKeywords)) {
      result.signals.push("ROF-05 detected");
    }
    dismissalFieldKeywords.forEach((keyword) => {
      if (combined.includes(keyword)) {
        result.signals.push(`${keyword} detected`);
      }
    });

    return result;
  }

  if (withdrawalScore >= 5 && withdrawalScore >= postponementScore) {
    result = {
      formType: "course_withdrawal",
      confidence: withdrawalScore >= 8 ? 0.9 : 0.74,
      signals: []
    };

    if (containsAny(combined, withdrawalTitleKeywords)) {
      result.signals.push("course withdrawal title detected");
    }
    withdrawalFieldKeywords.forEach((keyword) => {
      if (combined.includes(keyword)) {
        result.signals.push(`${keyword} detected`);
      }
    });

    return result;
  }

  if (postponementScore >= 5) {
    result = {
      formType: "postponement_of_studies",
      confidence: postponementScore >= 8 ? 0.9 : 0.74,
      signals: []
    };

    if (containsAny(combined, postponementTitleKeywords)) {
      result.signals.push("postponement title detected");
    }
    postponementFieldKeywords.forEach((keyword) => {
      if (combined.includes(keyword)) {
        result.signals.push(`${keyword} detected`);
      }
    });

    return result;
  }

  if (genericFormScore >= 3) {
    return {
      formType: "unknown_form",
      confidence: 0.52,
      signals: genericFormKeywords.filter((keyword) => combined.includes(keyword)).map((keyword) => `${keyword} detected`)
    };
  }

  return result;
}
