import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  user,
  User
} from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  user$: Observable<User | null>;

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.user$ = user(this.auth);
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string) {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      throw error;
    }
  }

  // Firestore methods
  async addDocument(collectionName: string, data: any) {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      const docRef = await addDoc(collectionRef, data);
      return docRef.id;
    } catch (error) {
      console.error('Lỗi thêm document:', error);
      throw error;
    }
  }

  async getDocuments(collectionName: string, ...queryConstraints: QueryConstraint[]) {
    try {
      const collectionRef = collection(this.firestore, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Lỗi lấy documents:', error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Lỗi cập nhật document:', error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Lỗi xóa document:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }
}
