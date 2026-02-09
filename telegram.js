import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, 
  increment, serverTimestamp, runTransaction 
} from "firebase/firestore";
import TelegramBot from "node-telegram-bot-api";

const firebaseConfig = {
  apiKey: "AIzaSyBgRpMLpxXrppWYOzDrDTLwiYiW-gP5Vtg",
  authDomain: "telegram-d341c.firebaseapp.com",
  projectId: "telegram-d341c",
  storageBucket: "telegram-d341c.firebasestorage.app",
  messagingSenderId: "164898531673",
  appId: "1:164898531673:web:eaa1fbcc3d156bc3be0448"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const bot = new TelegramBot("8091030648:AAFKQaTp3aec2rMf3qVhSehl4cON34WTUgA");

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const userId = message.from.id.toString();
  const firstName = message.from.first_name;

  // Referral Extraction
  let referralId = null;
  if (message.text.startsWith('/start')) {
    const parts = message.text.split(' ');
    if (parts.length > 1 && parts[1].startsWith('ref')) {
      referralId = parts[1].replace('ref', '');
    }
  }

  try {
    const userRef = doc(db, "users", userId);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        transaction.set(userRef, {
          id: userId,
          name: firstName,
          coins: 0,
          reffer: 0,
          refferBy: referralId,
          rewardGiven: false,
          frontendOpened: true
        });

        if (referralId && referralId !== userId) {
          const refRef = doc(db, "users", referralId);
          transaction.update(refRef, { coins: increment(500), reffer: increment(1) });
          transaction.set(doc(db, "ref_rewards", `${userId}_ref`), {
            userId, referrerId: referralId, reward: 500, createdAt: serverTimestamp()
          });
          transaction.update(userRef, { rewardGiven: true });
        }
      }
    });

    const welcomeMsg = `👋 Hi! Welcome ${firstName} ⭐\nYaha aap tasks complete karke real rewards kama sakte ho!`;
    await bot.sendPhoto(chatId, "https://i.ibb.co/CKK6Hyqq/1e48400d0ef9.jpg", {
      caption: welcomeMsg,
      reply_markup: {
        inline_keyboard: [
          [{ text: "▶ Open App", web_app: { url: "https://samiryoucant.github.io/Tg/" } }],
          [{ text: "📢 Channel", url: "https://t.me/dragonballz0928" }]
        ]
      }
    });
  } catch (e) { console.error(e); }

  res.status(200).send('OK');
}
