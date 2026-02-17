import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let db

export function getDb() {
  if (db) return db

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
    initializeApp({
      credential: cert(serviceAccount),
    })
  }

  db = getFirestore()
  return db
}
