/**
 * English is the source text and the lookup key; DE holds the German for each.
 * The choice lives on this device and switching reloads the app, so nothing needs to re-render live.
 */
export type Lang = 'en' | 'de'

const KEY = 'macrobridge.lang'

function saved(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/** Picked on Profile; before that, follows the phone's language. */
export const lang: Lang = (saved() ?? navigator.language).startsWith('de') ? 'de' : 'en'
export const locale = lang === 'de' ? 'de-DE' : 'en-US'
document.documentElement.lang = lang

export function setLang(next: Lang) {
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // Storage blocked: the choice lasts until the reload only
  }
  location.reload()
}

/** t('Adding to {date}', { date }) → the German (or English) text with {date} filled in. */
export function t(text: string, vars?: Record<string, string | number>) {
  let out = (lang === 'de' && DE[text]) || text
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  return out
}

const DE: Record<string, string> = {
  // Shared
  'Loading…': 'Lädt…',
  'Please wait…': 'Einen Moment…',
  'Back': 'Zurück',
  'Meal': 'Mahlzeit',
  'Meals': 'Mahlzeiten',
  'Breakfast': 'Frühstück',
  'Lunch': 'Mittag',
  'Dinner': 'Abend',
  'Snack': 'Snack',
  'Protein': 'Eiweiß',
  'Carbs': 'Kohlenh.',
  'Fat': 'Fett',
  'protein': 'Eiweiß',
  'carbs': 'Kohlenh.',
  'fat': 'Fett',
  'P {p} · C {c} · F {f}': 'E {p} · K {c} · F {f}',
  'Calories (kcal)': 'Kalorien (kcal)',
  'Protein (g)': 'Eiweiß (g)',
  'Carbs (g)': 'Kohlenhydrate (g)',
  'Fat (g)': 'Fett (g)',
  'Daily targets': 'Tagesziele',
  'Adding to {date}': 'Eintrag für {date}',
  'Description': 'Beschreibung',
  'Name': 'Name',
  'Add': 'Hinzufügen',
  'Remove': 'Entfernen',
  'Change': 'Ändern',
  'Save changes': 'Änderungen speichern',
  'Save failed': 'Speichern fehlgeschlagen',
  'Delete failed': 'Löschen fehlgeschlagen',
  'Delete "{name}"?': '„{name}“ löschen?',
  'Could not log this': 'Konnte nicht eingetragen werden',
  'Log this': 'Eintragen',
  'Today': 'Heute',
  'Friends': 'Freunde',
  'Something went wrong': 'Etwas ist schiefgelaufen',

  // Tab bar
  'Main': 'Hauptmenü',
  'Foods': 'Essen',
  'Profile': 'Profil',
  'Log a meal': 'Mahlzeit eintragen',
  '{label}, {n} new': '{label}, {n} neu',

  // Login and sign up
  'Describe a meal or snap a photo.': 'Beschreib eine Mahlzeit oder mach ein Foto.',
  "Your macros are logged against today's targets.": 'Deine Makros werden mit deinen Tageszielen verrechnet.',
  'New here?': 'Neu hier?',
  'Create an account': 'Konto erstellen',
  'Email': 'E-Mail',
  'Password': 'Passwort',
  'Log in': 'Anmelden',
  'Login failed': 'Anmeldung fehlgeschlagen',
  'Create account': 'Konto erstellen',
  'Set your daily targets. You can change them later.': 'Leg deine Tagesziele fest. Du kannst sie später ändern.',
  'Have an account?': 'Schon ein Konto?',
  'What friends see': 'Das sehen deine Freunde',
  'At least 8 characters': 'Mindestens 8 Zeichen',
  'Sign up failed': 'Registrierung fehlgeschlagen',

  // Change password
  'Change password': 'Passwort ändern',
  'Current password': 'Aktuelles Passwort',
  'New password': 'Neues Passwort',
  'Repeat new password': 'Neues Passwort wiederholen',
  "The new passwords don't match": 'Die neuen Passwörter stimmen nicht überein',
  'Password changed': 'Passwort geändert',
  'Could not change the password': 'Passwort konnte nicht geändert werden',

  // Today
  'Yesterday': 'Gestern',
  'Previous day': 'Vorheriger Tag',
  'Next day': 'Nächster Tag',
  '{eaten} of {target} kcal eaten': '{eaten} von {target} kcal gegessen',
  '{eaten} of {target} kcal': '{eaten} von {target} kcal',
  'kcal over': 'kcal drüber',
  'kcal left': 'kcal übrig',
  'Add a meal to this day': 'Mahlzeit zu diesem Tag hinzufügen',
  "Meal ideas for what's left": 'Ideen für den Rest des Tages',
  'Nothing logged on this day.': 'An diesem Tag nichts eingetragen.',
  'Nothing logged yet today. Tap + to log your first meal.':
    'Heute noch nichts eingetragen. Tippe auf +, um deine erste Mahlzeit einzutragen.',
  'Edit {name}': '{name} bearbeiten',
  'Delete {name}': '{name} löschen',

  // Foods
  'My foods': 'Meine Lebensmittel',
  'Search my foods': 'Meine Lebensmittel durchsuchen',
  'Save the meals you eat often, then log them again in two taps.':
    'Speichere Mahlzeiten, die du oft isst, und trag sie mit zwei Tipps wieder ein.',
  'No foods match "{q}".': 'Keine Lebensmittel passen zu „{q}“.',
  'Log': 'Eintragen',
  'Log a food': 'Lebensmittel eintragen',
  'Log {n} serving': '{n} Portion eintragen',
  'Log {n} servings': '{n} Portionen eintragen',
  'Edit this food': 'Lebensmittel bearbeiten',
  'Per serving ({serving}): {kcal} kcal · {pcf}': 'Pro Portion ({serving}): {kcal} kcal · {pcf}',
  'Servings': 'Portionen',
  'Fewer servings': 'Weniger Portionen',
  'More servings': 'Mehr Portionen',
  'This adds': 'Das kommt dazu',
  'Leaves you {n} kcal for today.': 'Danach bleiben dir heute {n} kcal.',
  'Leaves you {n} kcal for that day.': 'Danach bleiben dir an dem Tag {n} kcal.',
  "Puts you {n} kcal over today's target.": 'Damit liegst du {n} kcal über deinem heutigen Ziel.',
  "Puts you {n} kcal over that day's target.": 'Damit liegst du {n} kcal über dem Ziel für den Tag.',
  'New food': 'Neues Lebensmittel',
  'Edit food': 'Lebensmittel bearbeiten',
  'Save food': 'Lebensmittel speichern',
  'Delete food': 'Lebensmittel löschen',
  'Serving (optional)': 'Portion (optional)',
  'e.g. 1 bowl, 100 g': 'z. B. 1 Schüssel, 100 g',
  'Macros per serving': 'Makros pro Portion',
  'Logging 2 servings doubles these.': 'Bei 2 Portionen verdoppeln sie sich.',
  'Delete "{name}"? Meals you already logged keep their macros.':
    '„{name}“ löschen? Bereits eingetragene Mahlzeiten behalten ihre Makros.',

  // Log and edit a meal
  'Analysis failed': 'Analyse fehlgeschlagen',
  'Check the estimate': 'Schätzung prüfen',
  'Enter macros': 'Makros eingeben',
  'Save meal': 'Mahlzeit speichern',
  'Start over': 'Neu anfangen',
  'High confidence.': 'Hohe Sicherheit.',
  'Medium confidence.': 'Mittlere Sicherheit.',
  'Low confidence.': 'Geringe Sicherheit.',
  'Also save to my foods': 'Auch in meinen Lebensmitteln speichern',
  'Analyzing…': 'Wird analysiert…',
  'Analyze': 'Analysieren',
  'Enter macros manually': 'Makros selbst eingeben',
  'What did you eat?': 'Was hast du gegessen?',
  'e.g. 2 eggs, toast with butter, a latte': 'z. B. 2 Eier, Toast mit Butter, ein Latte',
  'Selected meal': 'Ausgewählte Mahlzeit',
  'Take or choose a photo': 'Foto aufnehmen oder auswählen',
  'Text, a photo, or both': 'Text, Foto oder beides',
  'Pick from my foods': 'Aus meinen Lebensmitteln wählen',
  'Edit meal': 'Mahlzeit bearbeiten',
  'Meal photo': 'Foto der Mahlzeit',
  'Progress': 'Fortschritt',
  'Recent': 'Zuletzt gegessen',
  'Change {name} before logging': '{name} vor dem Eintragen ändern',
  "Same as yesterday's breakfast?": 'Gleiches Frühstück wie gestern?',
  "Same as yesterday's lunch?": 'Gleiches Mittagessen wie gestern?',
  "Same as yesterday's dinner?": 'Gleiches Abendessen wie gestern?',
  "Same as yesterday's snack?": 'Gleicher Snack wie gestern?',
  'Last {n} days': 'Letzte {n} Tage',
  '{n}-day streak': '{n} Tage in Folge',
  'day streak': 'Tage in Folge',
  'days on target': 'Tage im Ziel',
  'kcal a day': 'kcal pro Tag',
  'Streak: days in a row with a meal logged. On target: within 10% of your calorie target.': 'In Folge: Tage hintereinander mit mindestens einer Mahlzeit. Im Ziel: höchstens 10 % neben deinem Kalorienziel.',
  'Calories': 'Kalorien',
  'Target {n}': 'Ziel {n}',
  'Nothing logged': 'Nichts eingetragen',
  "What's in it": 'Was drin ist',
  'Hide': 'Ausblenden',
  'Delete meal': 'Mahlzeit löschen',
  'Day': 'Tag',

  // Meal ideas
  'Meal ideas': 'Essensideen',
  'Left today': 'Heute übrig',
  'Anything in mind? (optional)': 'Etwas Bestimmtes im Kopf? (optional)',
  'e.g. quick, no cooking': 'z. B. schnell, ohne Kochen',
  'New ideas': 'Neue Ideen',
  'Thinking up meals that fit… this takes a few seconds.': 'Suche passende Mahlzeiten… das dauert ein paar Sekunden.',
  '{n} ideas that fit': '{n} passende Ideen',
  'Logging…': 'Wird eingetragen…',
  'Could not load ideas': 'Ideen konnten nicht geladen werden',

  // Profile
  'Change profile picture': 'Profilbild ändern',
  'Uploading…': 'Wird hochgeladen…',
  'Change photo': 'Foto ändern',
  'Add a photo': 'Foto hinzufügen',
  'Display name': 'Anzeigename',
  'Timezone': 'Zeitzone',
  'Decides when your day resets.': 'Bestimmt, wann dein Tag neu beginnt.',
  'Language': 'Sprache',
  'Your macros add up to {n} kcal.': 'Deine Makros ergeben {n} kcal.',
  'Friends can see my meals': 'Freunde sehen meine Mahlzeiten',
  'Saved': 'Gespeichert',
  'Log out': 'Abmelden',
  'Log out of MacroBridge?': 'Von MacroBridge abmelden?',
  'Remove your profile picture?': 'Profilbild entfernen?',
  'Could not upload the picture': 'Bild konnte nicht hochgeladen werden',
  'Could not remove the picture': 'Bild konnte nicht entfernt werden',

  // Friends
  'Add me as a friend on MacroBridge': 'Füg mich auf MacroBridge als Freund hinzu',
  'Invite link copied. Send it to a friend.': 'Einladungslink kopiert. Schick ihn einem Freund.',
  'Friend requests': 'Freundschaftsanfragen',
  'Wants to be friends': 'Möchte befreundet sein',
  'Decline': 'Ablehnen',
  'Accept': 'Annehmen',
  "Send your invite link to a friend. Once you're friends you'll see each other's day: calories, macros and meals.":
    'Schick deinen Einladungslink an einen Freund. Sobald ihr befreundet seid, seht ihr gegenseitig euren Tag: Kalorien, Makros und Mahlzeiten.',
  'Share my invite link': 'Einladungslink teilen',
  'Today, share of calorie target eaten': 'Heute, Anteil am Kalorienziel',
  'Private': 'Privat',
  'Sent requests': 'Gesendete Anfragen',
  'Waiting for them to accept': 'Wartet auf Bestätigung',
  'Cancel': 'Zurückziehen',
  'Latest meals': 'Neueste Mahlzeiten',
  'No meals from friends in the last 24 hours.': 'Keine Mahlzeiten von Freunden in den letzten 24 Stunden.',
  'Logged': 'Eingetragen',
  "Remove {name} as a friend? You'll stop seeing each other's meals.":
    '{name} als Freund entfernen? Ihr seht dann gegenseitig eure Mahlzeiten nicht mehr.',
  'Could not remove friend': 'Freund konnte nicht entfernt werden',
  'Not sharing': 'Teilt nicht',
  'Friends with {name}. Tap to remove.': 'Befreundet mit {name}. Tippen zum Entfernen.',
  "Today's meals": 'Heutige Mahlzeiten',
  'Nothing logged yet today.': 'Heute noch nichts eingetragen.',
  '{name} has turned off meal sharing.': '{name} hat das Teilen von Mahlzeiten ausgeschaltet.',

  // Invite
  'Friend invite': 'Freundschaftseinladung',
  'I already have an account': 'Ich habe schon ein Konto',
  'A friend invited you to MacroBridge. Log in or create an account to add them.':
    'Ein Freund hat dich zu MacroBridge eingeladen. Melde dich an oder erstelle ein Konto, um ihn hinzuzufügen.',
  'Could not send the request': 'Anfrage konnte nicht gesendet werden',
  "{name} invited you to be friends. You'll see each other's day once they accept.":
    '{name} hat dich als Freund eingeladen. Sobald die Anfrage angenommen ist, seht ihr gegenseitig euren Tag.',
  '{name} already sent you a request. Accept it to become friends.':
    '{name} hat dir schon eine Anfrage geschickt. Nimm sie an, um befreundet zu sein.',
  "Request sent. You'll be friends as soon as {name} accepts.": 'Anfrage gesendet. Ihr seid befreundet, sobald {name} annimmt.',
  'You and {name} are friends.': 'Du und {name} seid befreundet.',
  'This is your own invite link. Send it to a friend from the Friends tab.':
    'Das ist dein eigener Einladungslink. Schick ihn über den Tab „Freunde“ an einen Freund.',
  'Accept request': 'Anfrage annehmen',
  'Send friend request': 'Freundschaftsanfrage senden',
  "See {name}'s day": 'Tag von {name} ansehen',
  'Go to Friends': 'Zu den Freunden',

  // Errors from the app and the backend, translated where ErrorMessage shows them
  "Can't reach the server. Is the backend running?": 'Server nicht erreichbar. Prüf deine Internetverbindung.',
  'Food not found': 'Lebensmittel nicht gefunden',
  'Describe the meal or add a photo': 'Beschreib die Mahlzeit oder füg ein Foto hinzu',
  'Account no longer exists': 'Das Konto existiert nicht mehr',
  'An account with this email already exists': 'Mit dieser E-Mail gibt es schon ein Konto',
  "Couldn't come up with suggestions, try again": 'Keine Vorschläge gefunden, versuch es nochmal',
  "Couldn't recognize any food, try describing it": 'Kein Essen erkannt, beschreib es lieber',
  'Current password is wrong': 'Das aktuelle Passwort ist falsch',
  'Friend request not found': 'Freundschaftsanfrage nicht gefunden',
  'Invalid email or password': 'E-Mail oder Passwort ist falsch',
  'Invalid request': 'Ungültige Anfrage',
  'Malformed request body': 'Ungültige Anfrage',
  'Meal not found': 'Mahlzeit nicht gefunden',
  'Not friends with this person': 'Ihr seid nicht befreundet',
  "That's your own invite link": 'Das ist dein eigener Einladungslink',
  "The AI couldn't answer right now, try again": 'Die KI konnte gerade nicht antworten, versuch es nochmal',
  'The AI has hit its daily limit. Try again later, or enter macros manually.':
    'Die KI hat ihr Tageslimit erreicht. Versuch es später oder gib die Makros selbst ein.',
  'The picture must be a JPEG': 'Das Bild muss ein JPEG sein',
  "This invite link isn't valid": 'Dieser Einladungslink ist ungültig',
  'You already have a food with this name': 'Du hast schon ein Lebensmittel mit diesem Namen',
}
