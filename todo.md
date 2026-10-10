# To do

Feedback and ideas from friends testing the app.

## Done
- [x] Tap a meal to see what's in it (items, portions, macros): your own and friends'
- [x] Keep the photo you snapped and show it on the meal, for you and your friends
- [x] Progress screen: 30 days of calories and protein vs target, logging streak, days on target

## Later
- [ ] Take a picture of the fridge and get meal suggestions with recipes
- [ ] Save recipes from TikTok or Instagram videos
- [ ] Track vitamins and minerals, not just macros
- [ ] Recent meals and "same as yesterday" for one-tap re-logging, no AI needed
- [ ] Correct the AI estimate by typing ("it was 200 g of rice, not 150") instead of editing numbers
- [ ] Target calculator: height, weight, age, activity and goal give suggested calories and macros
- [ ] Weight log, shown on the progress chart
- [ ] Barcode scanning for packaged food (Open Food Facts, free; needs a small scanner library on iPhone)
- [ ] Reactions on friends' meals (💪 🔥)
- [ ] Weekly challenge between friends, e.g. most days hitting protein
- [ ] Reminder notifications (needs a service worker; near launch)

## Before going public (after the basic features)
Fix these before strangers sign up:
- [ ] Switch logins to Supabase Auth: email code at signup, forgot password, Sign in with Google; move friends' existing accounts over (keep their passwords and user IDs)
- [ ] Own domain (~€10-15/year) and Resend for login emails, so they don't land in spam
- [ ] GDPR: privacy policy and a "delete my account" button
- [ ] Paid Gemini key, so users' meal photos aren't used for training

Needed once there are more users:
- [ ] Gemini quota: the free key allows ~500 AI calls a day for the whole app
- [ ] Supabase Pro ($25/month): no pausing after a quiet week, daily backups, more space
- [ ] Move meal photos from Postgres to Supabase Storage
- [ ] Cloud Run: allow more than 1 instance; maybe keep one warm (~$10-15/month) to avoid the 6-9 s first load
