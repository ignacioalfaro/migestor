import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import * as XLSX from 'xlsx'; // Importa la librería XLSX (asegúrate de haber ejecutado 'npm install xlsx')
import { saveAs } from 'file-saver'; // Importa file-saver (asegúrate de haber ejecutado 'npm install file-saver')

// Contexto para Firebase y el Usuario
const FirebaseContext = createContext(null);

// --- Componentes personalizados con Tailwind CSS ---

// TailwindButton
const TailwindButton = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  let baseClasses = 'px-4 py-2 rounded-full font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-75';
  
  switch (variant) {
    case 'primary':
      baseClasses += ' bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md';
      break;
    case 'secondary':
      baseClasses += ' bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400 shadow-md';
      break;
    case 'success':
      baseClasses += ' bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 shadow-md';
      break;
    case 'danger':
      baseClasses += ' bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-md';
      break;
    case 'info':
      baseClasses += ' bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-400 shadow-md';
      break;
    case 'dark':
      baseClasses += ' bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-700 shadow-md';
      break;
    case 'outline-light':
      baseClasses += ' border border-white text-white hover:bg-white hover:text-blue-600 focus:ring-white shadow-sm';
      break;
    case 'light':
      baseClasses += ' bg-white text-blue-600 hover:bg-gray-100 focus:ring-white shadow-sm';
      break;
    case 'outline-secondary':
      baseClasses += ' border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-gray-300 shadow-sm';
      break;
    case 'google':
      baseClasses += ' bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md flex items-center justify-center gap-2';
      break;
    default:
      baseClasses += ' bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md';
  }

  if (disabled) {
    baseClasses += ' opacity-50 cursor-not-allowed';
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// TailwindCard
const TailwindCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-white shadow-lg rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

// TailwindInput
const TailwindInput = ({ label, type = 'text', value, onChange, placeholder, required = false, className = '', min = null, max = null, step = null, list = null, inputMode = null, pattern = null }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        list={list}
        inputMode={inputMode} // Añadido para teclado numérico
        pattern={pattern}     // Añadido para teclado numérico
        className={`shadow appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
      />
    </div>
  );
};

// TailwindSelect
const TailwindSelect = ({ label, value, onChange, children, className = '', required = false }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-200 ${className}`}
      >
        {children}
      </select>
    </div>
  );
};

// TailwindCheckbox
const TailwindCheckbox = ({ id, label, checked, onChange, className = '' }) => {
  return (
    <div className={`flex items-center mb-4 ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 transition-all duration-200"
      />
      <label htmlFor={id} className="ml-2 text-gray-700 text-sm">{label}</label>
    </div>
  );
};

// TailwindAlert
const TailwindAlert = ({ children, type = 'info', className = '' }) => {
  let baseClasses = 'p-3 rounded-lg text-center font-medium';
  switch (type) {
    case 'success':
      baseClasses += ' bg-green-100 text-green-800';
      break;
    case 'danger':
      baseClasses += ' bg-red-100 text-red-800';
      break;
    case 'warning':
      baseClasses += ' bg-yellow-100 text-yellow-800';
      break;
    case 'info':
      baseClasses += ' bg-blue-100 text-blue-800';
      break;
    default:
      baseClasses += ' bg-gray-100 text-gray-800';
  }
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

// TailwindModal (más complejo, simula el comportamiento de un modal)
const TailwindModal = ({ show, onClose, title, children, className = '' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>

      {/* Modal Content */}
      <div className={`bg-white rounded-xl shadow-xl z-50 w-full max-w-md mx-auto transform transition-all duration-300 scale-100 ${className}`}>
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};


// --- Componente principal de la aplicación ---
function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null); // Nuevo estado para el nombre del usuario
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setCurrentView] = useState('communityWallets'); // Vista por defecto
  const [selectedCommunityWallet, setSelectedCommunityWallet] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' o 'danger'
  const [showJoinWalletModal, setShowJoinWalletModal] = useState(false);
  const [joinWalletIdFromUrl, setJoinWalletIdFromUrl] = useState(null);
  const [firebaseInitError, setFirebaseInitError] = useState(null); // Nuevo estado para errores de inicialización

  useEffect(() => {
    console.log("App: useEffect de inicialización de Firebase ejecutándose.");
    try {
      // Configuración de Firebase para tu proyecto
      // Esta configuración es la que obtuviste de la Consola de Firebase
      // ¡REEMPLAZA ESTOS VALORES CON LOS QUE OBTUVISTE DE LA CONSOLA DE FIREBASE!
      const hardcodedFirebaseConfig = {
        apiKey: "AIzaSyCbbYSf8njsowgDWfHfzJMb2BVjr1QCdT0", // Reemplaza con tu API Key
        authDomain: "migestordegastos-e7e7c.firebaseapp.com", // Reemplaza con tu Auth Domain
        projectId: "migestordegastos-e7e7c", // Reemplaza con tu Project ID
        storageBucket: "migestordegastos-e7e7c.firebasestorage.app", // Reemplaza con tu Storage Bucket
        messagingSenderId: "367300940808", // Reemplaza con tu Messaging Sender ID
        appId: "1:367300940808:web:1ffaf415ad6221df512dbd", // Reemplaza con tu App ID
        measurementId: "G-GWGHNBBC38" // Reemplaza con tu Measurement ID (opcional)
      };

      // Usa la configuración inyectada por Canvas si está disponible, de lo contrario usa la hardcodeada
      const firebaseConfig = typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config)).length > 0
        ? JSON.parse(__firebase_config)
        : hardcodedFirebaseConfig;
      
      // Añadir un log para ver la configuración de Firebase que se está usando
      console.log("App: Firebase Config utilizada:", firebaseConfig);

      // Verificar si la configuración es válida antes de inicializar
      if (!firebaseConfig.apiKey) {
        console.error("App: Firebase Config no tiene apiKey. No se puede inicializar Firebase.");
        setFirebaseInitError("La configuración de Firebase no es válida. Falta la API Key.");
        setIsAuthReady(true); // Marcar como listo para mostrar el error
        return;
      }

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      // Log para ver la configuración que está usando la instancia de auth
      console.log("App: Configuración de Auth (firebaseAuth.app.options):", firebaseAuth.app.options);


      // Autenticación de Firebase
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        console.log("App: onAuthStateChanged - Usuario:", user);
        if (user) {
          setUserId(user.uid);
          setUserName(user.displayName || user.email || 'Usuario Anónimo'); // Establece el nombre del usuario
          console.log("App: Usuario autenticado. UID:", user.uid);
        } else {
          console.log("App: onAuthStateChanged - No hay usuario, intentando autenticación.");
          const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
          if (initialAuthToken) {
            try {
              console.log("App: Intentando signInWithCustomToken...");
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
              setUserId(firebaseAuth.currentUser.uid);
              setUserName(firebaseAuth.currentUser.displayName || firebaseAuth.currentUser.email || 'Usuario Anónimo');
              console.log("App: signInWithCustomToken exitoso. UID:", firebaseAuth.currentUser.uid);
            } catch (error) {
              console.error("App: Error al iniciar sesión con token personalizado:", error);
              // Si el token personalizado falla, intentar anónimo
              console.log("App: Intentando signInAnonymously...");
              await signInAnonymously(firebaseAuth);
              setUserId(firebaseAuth.currentUser.uid);
              setUserName('Usuario Anónimo');
              console.log("App: signInAnonymously exitoso. UID:", firebaseAuth.currentUser.uid);
            }
          } else {
            console.log("App: No hay initialAuthToken, intentando signInAnonymously...");
            await signInAnonymously(firebaseAuth);
            setUserId(firebaseAuth.currentUser.uid);
            setUserName('Usuario Anónimo');
            console.log("App: signInAnonymously exitoso. UID:", firebaseAuth.currentUser.uid);
          }
        }
        setIsAuthReady(true);
        console.log("App: isAuthReady establecido a true.");
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("App: Error al inicializar Firebase fuera de onAuthStateChanged:", error);
      setFirebaseInitError(`Error al inicializar la aplicación. Detalles: ${error.message}`);
      showMessage("Error al inicializar la aplicación. Inténtalo de nuevo.", "danger");
      setIsAuthReady(true); // Marcar como listo para mostrar el error
    }
  }, []);

  // Manejar parámetros de URL para unirse a una billetera
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const walletId = urlParams.get('joinWalletId');
    if (walletId) {
      setJoinWalletIdFromUrl(walletId);
      setShowJoinWalletModal(true);
      // Limpiar URL para evitar que se vuelva a activar al recargar
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('joinWalletId');
      window.history.replaceState({}, document.title, newUrl.pathname);
    }
  }, []);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      showMessage("Firebase Auth no está inicializado.", "danger");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showMessage("Sesión iniciada con Google.", "success");
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      showMessage(`Error al iniciar sesión con Google: ${error.message}`, "danger");
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl font-semibold text-gray-600">Cargando aplicación...</p>
      </div>
    );
  }

  // Mostrar mensaje de error si la inicialización de Firebase falló
  if (firebaseInitError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-100 p-4">
        <TailwindAlert type="danger" className="max-w-md">
          <h2 className="text-xl font-bold mb-2">Error de Inicialización</h2>
          <p>{firebaseInitError}</p>
          <p className="mt-4 text-sm">Por favor, revisa la consola del navegador (F12) para más detalles.</p>
        </TailwindAlert>
      </div>
    );
  }

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, userName, appId, showMessage }}>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Navbar de Tailwind */}
        <nav className="bg-blue-600 text-white shadow-md border-b-2 border-blue-400 py-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row justify-between items-center">
            <a href="#home" className="text-3xl font-bold text-white mb-4 lg:mb-0">Mi Gestor de Gastos</a>
            <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-4 w-full lg:w-auto">
              <TailwindButton
                variant={currentView === 'communityWallets' ? 'light' : 'outline-light'}
                className="w-full lg:w-auto"
                onClick={() => {
                  setCurrentView('communityWallets');
                  setSelectedCommunityWallet(null);
                }}
              >
                Billeteras Comunitarias
              </TailwindButton>
              <TailwindButton
                variant={currentView === 'personalWallet' ? 'light' : 'outline-light'}
                className="w-full lg:w-auto"
                onClick={() => setCurrentView('personalWallet')}
              >
                Billetera Personal
              </TailwindButton>
              <TailwindButton
                variant={currentView === 'futureExpenses' ? 'light' : 'outline-light'}
                className="w-full lg:w-auto"
                onClick={() => setCurrentView('futureExpenses')}
              >
                Gastos Futuros (Personal)
              </TailwindButton>
              <TailwindButton
                variant={currentView === 'bankManagement' ? 'light' : 'outline-light'}
                className="w-full lg:w-auto"
                onClick={() => setCurrentView('bankManagement')}
              >
                Gestión de Bancos
              </TailwindButton>
            </div>
          </div>
        </nav>

        {/* Mensajes de Alerta de Tailwind */}
        {message && (
          <TailwindAlert type={messageType} className="w-3/4 mx-auto mt-4 shadow-md">
            {message}
          </TailwindAlert>
        )}

        <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {userId && (
            <p className="text-center text-gray-500 mb-6 p-3 bg-white rounded-lg shadow-sm inline-block mx-auto">
              Hola, <code className="font-mono text-blue-600 font-bold">{userName}</code> (ID: <code className="font-mono text-blue-600 font-bold">{userId}</code>)
            </p>
          )}

          {!auth?.currentUser || auth.currentUser.isAnonymous ? (
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">Inicia sesión para guardar tus datos y acceder a todas las funciones.</p>
              <TailwindButton variant="google" onClick={handleGoogleSignIn} className="mx-auto">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.24 10.285V14.4h6.806c-.216 1.352-.76 2.37-1.595 3.166-1.074 1.04-2.583 1.95-5.21 1.95-4.17 0-7.54-3.37-7.54-7.54s3.37-7.54 7.54-7.54c2.09 0 3.655.895 4.79 1.99l3.05-3.054C19.75 2.94 17.06 2 12.24 2c-5.545 0-10 4.455-10 10s4.455 10 10 10 10-4.455 10-10h-9.76z"></path></svg>
                Iniciar sesión con Google
              </TailwindButton>
            </div>
          ) : (
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">Has iniciado sesión como: <span className="font-semibold text-blue-700">{userName}</span></p>
            </div>
          )}

          {currentView === 'communityWallets' && (
            <CommunityWalletsList
              onSelectWallet={(wallet) => {
                setSelectedCommunityWallet(wallet);
                setCurrentView('communityWalletDetail');
              }}
            />
          )}

          {currentView === 'communityWalletDetail' && selectedCommunityWallet && (
            <CommunityWalletDetail
              wallet={selectedCommunityWallet}
              onBack={() => {
                setSelectedCommunityWallet(null);
                setCurrentView('communityWallets');
              }}
            />
          )}

          {currentView === 'personalWallet' && (
            <PersonalWallet />
          )}

          {currentView === 'futureExpenses' && (
            <FutureExpenses />
          )}

          {currentView === 'bankManagement' && (
            <BankManagement />
          )}
        </div>
      </div>

      {showJoinWalletModal && joinWalletIdFromUrl && (
        <JoinWalletModal
          walletId={joinWalletIdFromUrl}
          onClose={() => setShowJoinWalletModal(false)}
          onJoinSuccess={() => {
            setShowJoinWalletModal(false);
            setCurrentView('communityWallets');
          }}
        />
      )}
    </FirebaseContext.Provider>
  );
}

// Componente CommunityWalletsList (Lista de Billeteras Comunitarias)
function CommunityWalletsList({ onSelectWallet }) {
  const { db, userId, userName, appId, showMessage } = useContext(FirebaseContext);
  const [wallets, setWallets] = useState([]);
  const [newWalletName, setNewWalletName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userId) return;

    // Consulta para billeteras donde el usuario actual es miembro
    // Se asegura de que la estructura del miembro en la consulta coincida con cómo se guarda
    const q = query(collection(db, `artifacts/${appId}/public/data/communityWallets`), where('members', 'array-contains', { id: userId, name: userName || 'Tú' }));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWallets(walletsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener billeteras comunitarias:", error);
      showMessage("Error al cargar las billeteras comunitarias.", "danger");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, userName, appId, showMessage]);

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      showMessage("El nombre de la billetera no puede estar vacío.", "danger");
      return;
    }
    if (!db || !userId) {
      showMessage("Error: Datos de usuario no disponibles.", "danger");
      return;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/communityWallets`), {
        name: newWalletName,
        creatorId: userId,
        members: [{ id: userId, name: userName || 'Tú' }], // El miembro inicial es el creador
        createdAt: serverTimestamp(),
      });
      setNewWalletName('');
      showMessage("Billetera comunitaria creada exitosamente!", "success");
    } catch (error) {
      console.error("Error al crear billetera comunitaria:", error);
      showMessage("Error al crear la billetera comunitaria.", "danger");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-600">Cargando billeteras comunitarias...</p>
      </div>
    );
  }

  return (
    <TailwindCard className="rounded-xl border-0">
      <h2 className="text-center mb-6 text-blue-600 font-bold text-3xl">Tus Billeteras Comunitarias</h2>

      <form onSubmit={handleCreateWallet} className="mb-6 flex flex-col sm:flex-row gap-3">
        <TailwindInput
          type="text"
          placeholder="Nombre de la nueva billetera"
          value={newWalletName}
          onChange={(e) => setNewWalletName(e.target.value)}
          className="flex-grow rounded-full px-4"
        />
        <TailwindButton variant="primary" type="submit" className="px-6">
          Crear Billetera
        </TailwindButton>
      </form>

      {wallets.length === 0 ? (
        <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No tienes billeteras comunitarias. ¡Crea una o únete a una!</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {wallets.map((wallet) => (
            <li
              key={wallet.id}
              onClick={() => onSelectWallet(wallet)}
              className="flex flex-col sm:flex-row justify-between items-center py-3 px-4 bg-white shadow-sm rounded-lg mb-2 cursor-pointer hover:shadow-md transition-shadow duration-200"
            >
              <span className="text-lg font-medium text-gray-800">{wallet.name}</span>
              <span className="text-gray-500 text-sm mt-1 sm:mt-0">{wallet.members ? wallet.members.length : 1} miembro(s)</span>
            </li>
          ))}
        </ul>
      )}
    </TailwindCard>
  );
}

// Componente CommunityWalletDetail (Detalle de Billetera Comunitaria)
function CommunityWalletDetail({ wallet, onBack }) {
  const { db, userId, userName, appId, showMessage } = useContext(FirebaseContext);
  const [members, setMembers] = useState(wallet.members || [{ id: userId, name: userName || 'Tú' }]);
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showReimbursementDetail, setShowReimbursementDetail] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);


  useEffect(() => {
    if (!db || !wallet?.id) return;

    const walletRef = doc(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}`);
    const unsubscribeWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedWallet = docSnap.data();
        setMembers(updatedWallet.members || []);
      }
    }, (error) => {
      console.error("Error al obtener detalles de la billetera:", error);
      showMessage("Error al cargar los detalles de la billetera.", "danger");
    });

    const qExpenses = query(collection(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}/expenses`));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
      setLoadingData(false);
    }, (error) => {
      console.error("Error al obtener gastos:", error);
      showMessage("Error al cargar los gastos de la billetera.", "danger");
      setLoadingData(false);
    });

    const qIncome = query(collection(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}/income`));
    const unsubscribeIncome = onSnapshot(qIncome, (snapshot) => {
      const incomeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncome(incomeData);
      setLoadingData(false);
    }, (error) => {
      console.error("Error al obtener ingresos:", error);
      showMessage("Error al cargar los ingresos de la billetera.", "danger");
      setLoadingData(false);
    });

    return () => {
      unsubscribeWallet();
      unsubscribeExpenses();
      unsubscribeIncome();
    };
  }, [db, wallet?.id, appId, showMessage]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      showMessage("El nombre del miembro no puede estar vacío.", "danger");
      return;
    }
    if (!db || !wallet?.id) return;

    const newMember = { id: crypto.randomUUID(), name: newMemberName.trim() };
    const updatedMembers = [...members, newMember];

    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}`), {
        members: updatedMembers,
      });
      setNewMemberName('');
      showMessage("Miembro añadido.", "success");
    } catch (error) {
      console.error("Error al añadir miembro:", error);
      showMessage("Error al añadir miembro.", "danger");
    }
  };

  const calculateBalance = () => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    return totalIncome - totalExpenses;
  };

  const handleMarkAsSettled = async (expenseId) => {
    if (!db || !wallet?.id) return;
    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}/expenses`, expenseId), {
        isSettled: true,
      });
      showMessage("Gasto de tarjeta marcado como saldado.", "success");
    } catch (error) {
      console.error("Error al saldar el gasto de tarjeta:", error);
      showMessage("Error al saldar el gasto de tarjeta.", "danger");
    }
  };

  // Lógica de cálculo de reembolsos para billetera comunitaria
  const calculateReimbursements = () => {
    const balances = {}; // memberId: monto total adeudado/a favor
    members.forEach(m => (balances[m.id] = 0));

    expenses.forEach(expense => {
      const payerId = expense.payerId;
      const amount = expense.amount;
      const participantsInvolved = expense.splitDetails ? Object.keys(expense.splitDetails) : [];

      const actualParticipantsInvolved = participantsInvolved.length > 0 ? participantsInvolved : members.map(m => m.id);

      if (expense.splitDetails) {
        for (const memberId in expense.splitDetails) {
          if (memberId === payerId) {
            balances[memberId] += (amount - expense.splitDetails[memberId]);
          } else {
            balances[memberId] -= expense.splitDetails[memberId];
          }
        }
      } else {
        const share = amount / actualParticipantsInvolved.length;
        balances[payerId] += amount;
        actualParticipantsInvolved.forEach(pId => {
          balances[pId] -= share;
        });
      }
    });

    const debts = [];
    const sortedBalances = Object.entries(balances).sort(([, a], [, b]) => a - b);

    let i = 0;
    let j = sortedBalances.length - 1;

    while (i < j) {
      const [debtorId, debtorBalance] = sortedBalances[i];
      const [creditorId, creditorBalance] = sortedBalances[j];

      if (debtorBalance >= -0.01 || creditorBalance <= 0.01) break;

      const amountToSettle = Math.min(Math.abs(debtorBalance), creditorBalance);

      debts.push({
        from: members.find(m => m.id === debtorId)?.name || debtorId,
        to: members.find(m => m.id === creditorId)?.name || creditorId,
        amount: amountToSettle,
        fromId: debtorId,
        toId: creditorId,
      });

      sortedBalances[i][1] += amountToSettle;
      sortedBalances[j][1] -= amountToSettle;

      if (sortedBalances[i][1] >= -0.01) i++;
      if (sortedBalances[j][1] <= 0.01) j--;
    }

    return debts;
  };

  const reimbursements = calculateReimbursements();

  const handleShowReimbursementDetail = (debt) => {
    setSelectedDebt(debt);
    setShowReimbursementDetail(true);
  };

  const getExpensesForDebt = (debt) => {
    return expenses.filter(expense => {
      const isFromBeneficiary = expense.splitDetails && expense.splitDetails[debt.fromId] > 0;
      const isToPayer = expense.payerId === debt.toId;
      return isFromBeneficiary && isToPayer;
    });
  };

  // Función para exportar gastos de tarjeta a Excel
  const handleExportCreditCardExpensesToExcel = () => {
    const creditCardExpenses = expenses.filter(exp => exp.type === 'credit_card');

    if (creditCardExpenses.length === 0) {
      showMessage("No hay gastos de tarjeta de crédito para exportar.", "info");
      return;
    }

    const dataToExport = creditCardExpenses.map(exp => {
      const payerName = members.find(m => m.id === exp.payerId)?.name || 'Desconocido';
      const splitDetailsText = exp.splitDetails
        ? Object.entries(exp.splitDetails)
            .map(([memberId, value]) => {
              const memberName = members.find(m => m.id === memberId)?.name || memberId;
              return `${memberName}: $${value.toFixed(2)}`;
            })
            .join(', ')
        : 'N/A';
      
      const installmentInfo = exp.isInstallment 
        ? `${exp.totalInstallments} cuotas de $${exp.installmentAmount.toFixed(2)} (hasta ${exp.installmentEndDate ? new Date(exp.installmentEndDate.seconds * 1000).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'N/A'})`
        : 'No';

      return {
        Descripción: exp.description,
        Monto: exp.amount.toFixed(2),
        Pagado_Por: payerName,
        Banco: exp.bank || 'N/A',
        Tipo_Tarjeta: exp.cardType || 'N/A',
        Fecha: exp.date ? new Date(exp.date.seconds * 1000).toLocaleDateString('es-AR') : 'N/A',
        Tipo_División: exp.splitType === 'equal' ? 'Partes Iguales' : exp.splitType === 'amount' ? 'Por Montos' : exp.splitType === 'percentage' ? 'Por Porcentajes' : 'N/A',
        Detalle_División: splitDetailsText,
        Es_Cuotas: installmentInfo,
        Saldado: exp.isSettled ? 'Sí' : 'No'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gastos Tarjeta Comunitaria");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `Gastos_Tarjeta_${wallet.name}_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`);
    showMessage("Gastos de tarjeta exportados a Excel.", "success");
  };


  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-600">Cargando datos de la billetera...</p>
      </div>
    );
  }

  const currentBalance = calculateBalance();

  return (
    <TailwindCard className="rounded-xl border-0">
      <TailwindButton variant="outline-secondary" className="mb-6" onClick={onBack}>
        ← Volver a Billeteras
      </TailwindButton>
      <h2 className="text-center mb-6 text-blue-600 font-bold text-3xl">{wallet.name}</h2>

      <p className={`text-center text-5xl font-bold mb-6 p-4 rounded-lg ${currentBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        Saldo Actual: ${currentBalance.toFixed(2)}
      </p>

      {/* Sección de Miembros */}
      <TailwindCard className="bg-blue-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Miembros</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {members.map(m => (
            <span key={m.id} className="bg-blue-200 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {m.name} ({m.id === userId ? 'Tú' : m.id.substring(0, 4)}...)
            </span>
          ))}
        </div>
        <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
          <TailwindInput
            type="text"
            placeholder="Nombre del nuevo miembro"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-grow rounded-full px-4 text-sm"
          />
          <TailwindButton variant="primary" type="submit" className="px-4 py-2 text-sm">
            Añadir Miembro
          </TailwindButton>
        </form>
        <div className="text-center mt-4">
          <TailwindButton variant="dark" className="px-4 py-2 text-sm" onClick={() => setShowInviteModal(true)}>
            Invitar Miembro por Enlace
          </TailwindButton>
        </div>
      </TailwindCard>

      {/* Botones para Añadir Ingreso/Gasto */}
      <div className="text-center mb-6 flex flex-col sm:flex-row justify-center gap-4">
        <TailwindButton variant="success" className="px-6" onClick={() => setShowAddIncomeModal(true)}>
          Añadir Ingreso
        </TailwindButton>
        <TailwindButton variant="danger" className="px-6" onClick={() => setShowAddExpenseModal(true)}>
          Añadir Gasto
        </TailwindButton>
        <TailwindButton variant="info" className="px-6" onClick={handleExportCreditCardExpensesToExcel}>
          Exportar Gastos Tarjeta (Excel)
        </TailwindButton>
      </div>

      {/* Lista de Ingresos */}
      <TailwindCard className="bg-yellow-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Ingresos</h3>
        {income.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No hay ingresos registrados.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {income.map((item) => (
              <li key={item.id} className="flex flex-col sm:flex-row justify-content-between items-start sm:items-center py-3 px-4 bg-white shadow-sm rounded-lg mb-2">
                <div>
                  <span className="font-medium text-gray-800">{item.description}</span>
                  <p className="text-gray-500 text-xs mt-1">
                    Fecha: {item.date ? new Date(item.date.seconds * 1000).toLocaleDateString('es-AR') : 'N/A'}
                  </p>
                </div>
                <span className="font-bold text-xl text-green-600 mt-2 sm:mt-0">+${item.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>

      {/* Lista de Gastos */}
      <TailwindCard className="bg-red-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Gastos</h3>
        {expenses.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No hay gastos registrados.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <li key={expense.id} className="bg-white shadow-sm rounded-lg mb-2 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <span className="font-medium text-gray-800">{expense.description}</span>
                  <span className="font-bold text-xl text-red-600 mt-2 sm:mt-0">-${expense.amount.toFixed(2)}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Pagado por: <span className="font-semibold">{members.find(m => m.id === expense.payerId)?.name || 'Desconocido'}</span>
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Tipo: {expense.type === 'credit_card' ? `Tarjeta de Crédito (${expense.bank} - ${expense.cardType})` : 'Débito/Efectivo'}
                </p>
                {expense.splitType && (
                  <p className="text-gray-500 text-xs mt-1">
                    División: {expense.splitType === 'equal' ? 'Partes Iguales' :
                                expense.splitType === 'amount' ? 'Por Montos' : 'Por Porcentajes'}
                  </p>
                )}
                {expense.splitDetails && Object.keys(expense.splitDetails).length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Detalle:
                    <ul className="list-disc list-inside ml-2">
                      {Object.entries(expense.splitDetails).map(([memberId, value]) => (
                        <li key={memberId}>
                          {members.find(m => m.id === memberId)?.name || memberId}: {expense.splitType === 'percentage' ? `${value}%` : `$${value.toFixed(2)}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {expense.isInstallment && (
                  <p className="text-purple-600 font-medium text-xs mt-2">
                    En cuotas: {expense.totalInstallments} cuotas de ${expense.installmentAmount.toFixed(2)} (hasta {expense.installmentEndDate ? new Date(expense.installmentEndDate.seconds * 1000).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'N/A'})
                  </p>
                )}
                {expense.type === 'credit_card' && !expense.isSettled && (
                  <div className="text-right mt-3">
                    <TailwindButton
                      variant="info"
                      className="px-4 py-2 text-sm"
                      onClick={() => handleMarkAsSettled(expense.id)}
                    >
                      Marcar como Saldado
                    </TailwindButton>
                  </div>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Fecha: {expense.date ? new Date(expense.date.seconds * 1000).toLocaleDateString('es-AR') : 'N/A'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>

      {/* Sección de Reembolsos */}
      <TailwindCard className="bg-green-50 p-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Reembolsos Pendientes</h3>
        {reimbursements.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">¡Todo está saldado en esta billetera!</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reimbursements.map((debt, index) => (
              <li
                key={index}
                onClick={() => handleShowReimbursementDetail(debt)}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 bg-white shadow-sm rounded-lg mb-2 cursor-pointer hover:shadow-md transition-shadow duration-200"
              >
                <span className="text-gray-800">
                  <span className="font-semibold text-red-600">{debt.from}</span> le debe a <span className="font-semibold text-green-600">{debt.to}</span>
                </span>
                <span className="font-bold text-xl text-green-600 mt-2 sm:mt-0">${debt.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>

      {/* Modales */}
      <AddIncomeModal show={showAddIncomeModal} walletId={wallet.id} onClose={() => setShowAddIncomeModal(false)} />
      <AddCommunityExpenseModal show={showAddExpenseModal} walletId={wallet.id} members={members} onClose={() => setShowAddExpenseModal(false)} />
      <ReimbursementDetailModal show={showReimbursementDetail} debt={selectedDebt} expenses={selectedDebt ? getExpensesForDebt(selectedDebt) : []} participants={members} onClose={() => setShowReimbursementDetail(false)} />
      <InviteMemberModal show={showInviteModal} walletId={wallet.id} walletName={wallet.name} onClose={() => setShowInviteModal(false)} />
    </TailwindCard>
  );
}

// Componente AddIncomeModal (Modal para Añadir Ingreso)
function AddIncomeModal({ walletId, onClose, show }) {
  const { db, userId, appId, showMessage } = useContext(FirebaseContext);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      showMessage("Por favor, completa la descripción y el monto válido.", "danger");
      return;
    }
    if (!db || !userId) return;

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/communityWallets/${walletId}/income`), {
        description: description.trim(),
        amount: parseFloat(amount),
        contributorId: userId,
        date: serverTimestamp(),
      });
      showMessage("Ingreso añadido exitosamente!", "success");
      onClose();
    } catch (error) {
      console.error("Error al añadir ingreso:", error);
      showMessage("Error al añadir el ingreso.", "danger");
    }
  };

  return (
    <TailwindModal show={show} onClose={onClose} title="Añadir Nuevo Ingreso">
      <form onSubmit={handleAddIncome}>
        <TailwindInput
          label="Descripción:"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <TailwindInput
          label="Monto:"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          required
          inputMode="numeric" // Teclado numérico
          pattern="[0-9]*"   // Patrón para números
        />
        <div className="flex justify-end gap-2 mt-6">
          <TailwindButton variant="secondary" onClick={onClose}>
            Cancelar
          </TailwindButton>
          <TailwindButton variant="success" type="submit">
            Guardar Ingreso
          </TailwindButton>
        </div>
      </form>
    </TailwindModal>
  );
}

// Componente AddCommunityExpenseModal (Modal para Añadir Gasto Comunitario)
function AddCommunityExpenseModal({ walletId, members, onClose, show }) {
  const { db, userId, appId, showMessage } = useContext(FirebaseContext);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(userId);
  const [expenseType, setExpenseType] = useState('debit_cash');
  const [bank, setBank] = useState('');
  const [cardType, setCardType] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splitDetails, setSplitDetails] = useState({});
  const [selectedParticipantsForExpense, setSelectedParticipantsForExpense] = useState(members.map(m => m.id));
  const [creditCardBanks, setCreditCardBanks] = useState([]);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');

  useEffect(() => {
    if (db && userId) {
      const q = query(collection(db, `artifacts/${appId}/users/${userId}/banks`), where('type', '==', 'credit_card'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedBanks = snapshot.docs.map(doc => ({name: doc.data().name, cardType: doc.data().cardType || ''}));
        setCreditCardBanks(fetchedBanks);
      }, (error) => {
        console.error("Error al obtener bancos de tarjeta de crédito:", error);
      });
      return () => unsubscribe();
    }
  }, [db, userId, appId]);

  useEffect(() => {
    const initialSplitDetails = {};
    const totalAmt = parseFloat(amount) || 0;
    const numSelected = selectedParticipantsForExpense.length;

    members.forEach(member => {
      if (selectedParticipantsForExpense.includes(member.id)) {
        initialSplitDetails[member.id] = splitType === 'equal' && numSelected > 0 ? (totalAmt / numSelected) : 0;
      } else {
        initialSplitDetails[member.id] = 0;
      }
    });
    setSplitDetails(initialSplitDetails);
  }, [members, splitType, amount, selectedParticipantsForExpense]);


  const handleSplitDetailChange = (memberId, value) => {
    setSplitDetails(prev => ({ ...prev, [memberId]: parseFloat(value) || 0 }));
  };

  const handleParticipantSelection = (memberId, isChecked) => {
    if (isChecked) {
      setSelectedParticipantsForExpense(prev => [...prev, memberId]);
    } else {
      setSelectedParticipantsForExpense(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleBankChange = (e) => {
    const selectedBankName = e.target.value;
    setBank(selectedBankName);
    const selectedBank = creditCardBanks.find(b => b.name === selectedBankName);
    if (selectedBank) {
      setCardType(selectedBank.cardType);
    } else {
      setCardType('');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      showMessage("Por favor, completa la descripción y el monto válido.", "danger");
      return;
    }
    if (selectedParticipantsForExpense.length === 0) {
      showMessage("Debes seleccionar al menos un participante para este gasto.", "danger");
      return;
    }
    if (expenseType === 'credit_card' && !bank.trim()) {
      showMessage("Para gastos con tarjeta de crédito, selecciona un banco.", "danger");
      return;
    }
    if (isInstallment && (!totalInstallments || parseInt(totalInstallments) <= 0)) {
      showMessage("Para gastos en cuotas, especifica un número válido de cuotas.", "danger");
      return;
    }

    let finalSplitDetails = {};
    const totalAmount = parseFloat(amount);
    const actualParticipants = members.filter(m => selectedParticipantsForExpense.includes(m.id));

    if (splitType === 'equal') {
      const share = totalAmount / actualParticipants.length;
      actualParticipants.forEach(member => {
        finalSplitDetails[member.id] = share;
      });
    } else if (splitType === 'amount') {
      const sumOfAmounts = Object.values(splitDetails).reduce((sum, val) => sum + val, 0);
      if (Math.abs(sumOfAmounts - totalAmount) > 0.01) {
        showMessage("La suma de los montos no coincide con el monto total del gasto.", "danger");
        return;
      }
      finalSplitDetails = splitDetails;
    } else if (splitType === 'percentage') {
      const sumOfPercentages = Object.values(splitDetails).reduce((sum, val) => sum + val, 0);
      if (Math.abs(sumOfPercentages - 100) > 0.01) {
        showMessage("La suma de los porcentajes debe ser 100%.", "danger");
        return;
      }
      actualParticipants.forEach(member => {
        finalSplitDetails[member.id] = (splitDetails[member.id] / 100) * totalAmount;
      });
    }

    let installmentAmount = null;
    let installmentEndDate = null;

    if (isInstallment) {
      const numInstallments = parseInt(totalInstallments);
      installmentAmount = totalAmount / numInstallments;

      const today = new Date();
      // Calculate end date for installments
      const endDate = new Date(today.getFullYear(), today.getMonth() + numInstallments, today.getDate());
      installmentEndDate = endDate;
    }

    const expenseDataToSave = {
      description: description.trim(),
      amount: totalAmount,
      payerId: payerId,
      type: expenseType,
      bank: expenseType === 'credit_card' ? bank.trim() : null,
      cardType: expenseType === 'credit_card' ? cardType.trim() : null,
      date: serverTimestamp(),
      splitType: splitType,
      splitDetails: finalSplitDetails,
      isSettled: false,
      isInstallment: isInstallment,
      totalInstallments: isInstallment ? parseInt(totalInstallments) : null, // Ensure integer
      installmentAmount: isInstallment ? installmentAmount : null,
      installmentEndDate: isInstallment ? installmentEndDate : null, // This will be a Date object, Firestore will convert it to Timestamp
    };

    console.log("AddCommunityExpenseModal: Datos del gasto a guardar:", expenseDataToSave);

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/communityWallets/${walletId}/expenses`), expenseDataToSave);
      showMessage("Gasto añadido exitosamente!", "success");
      onClose();
    } catch (error) {
      console.error("Error al añadir gasto:", error);
      showMessage("Error al añadir el gasto.", "danger");
    }
  };

  return (
    <TailwindModal show={show} onClose={onClose} title="Añadir Gasto Comunitario">
      <form onSubmit={handleAddExpense}>
        <TailwindInput
          label="Descripción:"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <TailwindInput
          label="Monto Total:"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          required
          inputMode="numeric" // Teclado numérico
          pattern="[0-9]*"   // Patrón para números
        />
        <TailwindSelect label="Pagado por:" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </TailwindSelect>

        <TailwindSelect label="Tipo de Gasto:" value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
          <option value="debit_cash">Débito/Efectivo</option>
          <option value="credit_card">Tarjeta de Crédito</option>
        </TailwindSelect>

        {expenseType === 'credit_card' && (
          <TailwindSelect label="Banco:" value={bank} onChange={handleBankChange} required>
            <option value="">Selecciona un banco</option>
            {creditCardBanks.map((b, index) => (
              <option key={index} value={b.name}>{b.name}</option>
            ))}
          </TailwindSelect>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Participantes en este gasto:</label>
          <div className="grid gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
            {members.map(member => (
              <TailwindCheckbox
                key={member.id}
                id={`member-${member.id}`}
                label={member.name}
                checked={selectedParticipantsForExpense.includes(member.id)}
                onChange={(e) => handleParticipantSelection(member.id, e.target.checked)}
              />
            ))}
          </div>
        </div>

        <TailwindSelect label="Método de División:" value={splitType} onChange={(e) => setSplitType(e.target.value)}>
          <option value="equal">Partes Iguales</option>
          <option value="amount">Por Montos</option>
          <option value="percentage">Por Porcentajes</option>
        </TailwindSelect>

        {splitType !== 'equal' && (
          <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-gray-50">
            <p className="font-semibold mb-3">Detalle de División:</p>
            {members.filter(m => selectedParticipantsForExpense.includes(m.id)).map(member => (
              <div key={member.id} className="flex items-center mb-2">
                <label className="w-1/3 text-sm text-gray-700">{member.name}:</label>
                <div className="w-2/3 flex items-center">
                  <TailwindInput
                    type="number"
                    value={splitDetails[member.id] || ''}
                    onChange={(e) => handleSplitDetailChange(member.id, e.target.value)}
                    step="0.01"
                    placeholder={splitType === 'percentage' ? '%' : '$'}
                    className="flex-grow mr-2"
                    inputMode="numeric" // Teclado numérico
                    pattern="[0-9]*"   // Patrón para números
                  />
                  {splitType === 'percentage' && <span className="text-gray-600">%</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <TailwindCheckbox
          id="isInstallment"
          label="Gasto en cuotas"
          checked={isInstallment}
          onChange={(e) => setIsInstallment(e.target.checked)}
        />

        {isInstallment && (
          <TailwindInput
            label="Número de cuotas:"
            type="number"
            value={totalInstallments}
            onChange={(e) => setTotalInstallments(e.target.value)}
            min="1"
            required={isInstallment}
            inputMode="numeric" // Teclado numérico
            pattern="[0-9]*"   // Patrón para números
          />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <TailwindButton variant="secondary" onClick={onClose}>
            Cancelar
          </TailwindButton>
          <TailwindButton variant="success" type="submit">
            Guardar Gasto
          </TailwindButton>
        </div>
      </form>
    </TailwindModal>
  );
}

// Componente ReimbursementDetailModal (Modal de Detalle de Reembolso)
function ReimbursementDetailModal({ debt, expenses, participants, onClose, show }) {
  return (
    <TailwindModal show={show} onClose={onClose} title={`Detalle de Deuda: ${debt?.from} le debe a ${debt?.to}`}>
      <p className="text-center text-3xl font-bold text-green-600 mb-6 p-3 bg-green-100 rounded-lg">Monto Total: ${debt?.amount.toFixed(2)}</p>

      <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {expenses.length === 0 ? (
          <p className="text-center text-gray-500">No se encontraron gastos directamente relacionados con esta deuda en esta vista simplificada.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <li key={expense.id} className="bg-white shadow-sm rounded-lg mb-2 p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{expense.description}</span>
                  <span className="font-bold text-xl">${expense.amount.toFixed(2)}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Pagado por: <span className="font-semibold">{participants.find(p => p.id === expense.payerId)?.name || 'Desconocido'}</span>
                </p>
                {expense.splitDetails && Object.keys(expense.splitDetails).length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Para: {Object.keys(expense.splitDetails).map(pId => participants.find(p => p.id === pId)?.name || pId).join(', ')}
                  </p>
                )}
                {expense.isInstallment && (
                  <p className="text-purple-600 font-medium text-xs mt-2">
                    En cuotas: {expense.totalInstallments} cuotas de ${expense.installmentAmount.toFixed(2)} (hasta {expense.installmentEndDate ? new Date(expense.installmentEndDate.seconds * 1000).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'N/A'})
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Fecha: {expense.date ? new Date(expense.date.seconds * 1000).toLocaleDateString('es-AR') : 'N/A'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <TailwindButton variant="primary" onClick={onClose}>
          Cerrar
        </TailwindButton>
      </div>
    </TailwindModal>
  );
}

// Componente PersonalWallet (Billetera Personal)
function PersonalWallet() {
  const { db, userId, appId, showMessage } = useContext(FirebaseContext);
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [account, setAccount] = useState('Efectivo');
  const [moneyStorageBanks, setMoneyStorageBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [allCommunityWallets, setAllCommunityWallets] = useState([]);
  const [communityMembers, setCommunityMembers] = useState([]);

  useEffect(() => {
    if (!db || !userId) return;

    const qTransactions = query(collection(db, `artifacts/${appId}/users/${userId}/personalWalletTransactions`));
    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(items);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener transacciones personales:", error);
      showMessage("Error al cargar las transacciones personales.", "danger");
      setLoading(false);
    });

    const qBanks = query(collection(db, `artifacts/${appId}/users/${userId}/banks`), where('type', '==', 'money_storage'));
    const unsubscribeBanks = onSnapshot(qBanks, (snapshot) => {
      const fetchedBanks = snapshot.docs.map(doc => doc.data().name);
      setMoneyStorageBanks(['Efectivo', ...fetchedBanks]);
    }, (error) => {
      console.error("Error al obtener bancos para billetera personal:", error);
    });

    const qCommunityWallets = query(collection(db, `artifacts/${appId}/public/data/communityWallets`));
    const unsubscribeCommunityWallets = onSnapshot(qCommunityWallets, async (snapshot) => {
      const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const expensesPromises = walletsData.map(async (wallet) => {
        const qExpenses = query(collection(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}/expenses`));
        const expenseSnapshot = await getDocs(qExpenses);
        return expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      });
      const allExpenses = await Promise.all(expensesPromises);
      const walletsWithExpenses = walletsData.map((wallet, index) => ({
        ...wallet,
        expenses: allExpenses[index],
      }));
      setAllCommunityWallets(walletsWithExpenses);

      const allMembers = new Set();
      walletsData.forEach(wallet => {
        if (wallet.members) {
          wallet.members.forEach(member => {
            allMembers.add(JSON.stringify(member));
          });
        }
      });
      setCommunityMembers(Array.from(allMembers).map(memberStr => JSON.parse(memberStr)));

    }, (error) => {
      console.error("Error al obtener todas las billeteras comunitarias:", error);
    });


    return () => {
      unsubscribeTransactions();
      unsubscribeBanks();
      unsubscribeCommunityWallets();
    };
  }, [db, userId, appId, showMessage]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      showMessage("Por favor, completa la descripción y el monto válido.", "danger");
      return;
    }
    if (!db || !userId) return;

    try {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/personalWalletTransactions`), {
        description: description.trim(),
        amount: parseFloat(amount),
        type: type,
        account: account,
        date: serverTimestamp(),
      });
      setDescription('');
      setAmount('');
      showMessage("Transacción personal añadida.", "success");
    } catch (error) {
      console.error("Error al añadir transacción personal:", error);
      showMessage("Error al añadir la transacción personal.", "danger");
    }
  };

  const calculateCurrentBalance = () => {
    let totalBalance = 0;
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalBalance += t.amount;
      } else {
        totalBalance -= t.amount;
      }
    });
    return totalBalance;
  };

  const getBalanceByAccount = () => {
    const accountBalances = {};
    moneyStorageBanks.forEach(b => (accountBalances[b] = 0));

    transactions.forEach(t => {
      if (!accountBalances[t.account]) {
        accountBalances[t.account] = 0;
      }
      if (t.type === 'income') {
        accountBalances[t.account] += t.amount;
      } else {
        accountBalances[t.account] -= t.amount;
      }
    });

    return accountBalances;
  };

  const calculateTotalReimbursements = () => {
    const reimbursements = [];
    allCommunityWallets.forEach(wallet => {
      const membersInWallet = wallet.members || [];
      const expensesInWallet = wallet.expenses || [];

      const balances = {};
      membersInWallet.forEach(m => (balances[m.id] = 0));

      expensesInWallet.forEach(expense => {
        const payerId = expense.payerId;
        const amount = expense.amount;
        const participantsInvolved = expense.splitDetails ? Object.keys(expense.splitDetails) : [];
        const actualParticipantsInvolved = participantsInvolved.length > 0 ? participantsInvolved : membersInWallet.map(m => m.id);

        if (expense.splitDetails) {
          for (const memberId in expense.splitDetails) {
            if (memberId === payerId) {
              balances[memberId] += (amount - expense.splitDetails[memberId]);
            } else {
              balances[memberId] -= expense.splitDetails[memberId];
            }
          }
        } else {
          const share = amount / actualParticipantsInvolved.length;
          balances[payerId] += amount;
          actualParticipantsInvolved.forEach(pId => {
            balances[pId] -= share;
          });
        }
      });

      const sortedBalances = Object.entries(balances).sort(([, a], [, b]) => a - b);

      let i = 0;
      let j = sortedBalances.length - 1;

      while (i < j) {
        const [debtorId, debtorBalance] = sortedBalances[i];
        const [creditorId, creditorBalance] = sortedBalances[j];

        if (debtorBalance >= -0.01 || creditorBalance <= 0.01) break;

        const amountToSettle = Math.min(Math.abs(debtorBalance), creditorBalance);

        // Solo añadir reembolsos relevantes para el usuario actual
        if (debtorId === userId || creditorId === userId) {
          reimbursements.push({
            from: communityMembers.find(m => m.id === debtorId)?.name || debtorId,
            to: communityMembers.find(m => m.id === creditorId)?.name || creditorId,
            amount: amountToSettle,
            fromId: debtorId,
            toId: creditorId,
            walletName: wallet.name,
          });
        }

        sortedBalances[i][1] += amountToSettle;
        sortedBalances[j][1] -= amountToSettle;

        if (sortedBalances[i][1] >= -0.01) i++;
        if (sortedBalances[j][1] <= 0.01) j--;
      }
    });
    return reimbursements;
  };

  const currentBalance = calculateCurrentBalance();
  const accountBalances = getBalanceByAccount();
  const totalReimbursements = calculateTotalReimbursements();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-600">Cargando billetera personal...</p>
      </div>
    );
  }

  return (
    <TailwindCard className="rounded-xl border-0">
      <h2 className="text-center mb-6 text-blue-600 font-bold text-3xl">Mi Billetera Personal</h2>

      <p className={`text-center text-5xl font-bold mb-6 p-4 rounded-lg ${currentBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        Saldo Actual Total: ${currentBalance.toFixed(2)}
      </p>

      {/* Saldo por Ubicación */}
      <TailwindCard className="bg-yellow-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Saldo por Ubicación</h3>
        {Object.keys(accountBalances).length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No hay saldos por ubicación.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {Object.entries(accountBalances).map(([accName, balance]) => (
              <li key={accName} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 bg-white shadow-sm rounded-lg mb-2">
                <span className="font-medium text-gray-800">{accName}:</span>
                <span className={`font-bold text-xl mt-2 sm:mt-0 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${balance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>

      {/* Formulario para Añadir Transacción */}
      <TailwindCard className="bg-blue-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Añadir Transacción Personal</h3>
        <form onSubmit={handleAddTransaction}>
          <TailwindInput
            label="Descripción:"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <TailwindInput
            label="Monto:"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            required
            inputMode="numeric" // Teclado numérico
            pattern="[0-9]*"   // Patrón para números
          />
          <TailwindSelect label="Tipo:" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </TailwindSelect>
          <TailwindSelect label="Ubicación del Dinero:" value={account} onChange={(e) => setAccount(e.target.value)}>
            {moneyStorageBanks.map((b, index) => (
              <option key={index} value={b}>{b}</option>
            ))}
          </TailwindSelect>
          <TailwindButton variant="primary" type="submit" className="w-full mt-4">
            Añadir Transacción
          </TailwindButton>
        </form>
      </TailwindCard>

      <div className="text-center mb-6">
        <TailwindButton variant="dark" className="px-6" onClick={() => setShowTransferModal(true)}>
          Realizar Transferencia
        </TailwindButton>
      </div>

      {/* Sección de Reembolsos Pendientes (Billetera Personal) */}
      <TailwindCard className="bg-green-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Reembolsos Pendientes (General)</h3>
        {totalReimbursements.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No hay reembolsos pendientes en tus billeteras comunitarias.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {totalReimbursements.map((debt, index) => (
              <li key={index} className="bg-white shadow-sm rounded-lg mb-2 p-4">
                <span className="font-medium text-gray-800">
                  {debt.fromId === userId ? (
                    <span className="font-semibold text-green-600">Te deben ${debt.amount.toFixed(2)} de {debt.from}</span>
                  ) : (
                    <span className="font-semibold text-red-600">Debes ${debt.amount.toFixed(2)} a {debt.to}</span>
                  )}
                </span>
                <p className="text-gray-500 text-xs mt-1">En billetera: {debt.walletName}</p>
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>


      {/* Lista de Transacciones Personales */}
      <TailwindCard className="bg-purple-50 p-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Mis Transacciones</h3>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No hay transacciones personales registradas.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {transactions.map((item) => (
              <li key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 bg-white shadow-sm rounded-lg mb-2">
                <div>
                  <span className="font-medium text-gray-800">{item.description}</span>
                  <p className={`text-sm font-semibold mt-1 ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'income' ? 'Ingreso' : 'Gasto'} ({item.account})
                  </p>
                </div>
                <div className="text-right mt-2 sm:mt-0">
                  <span className={`font-bold text-xl ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    ${item.amount.toFixed(2)}
                  </span>
                  <p className="text-gray-500 text-xs mt-1">
                    Fecha: {item.date ? new Date(item.date.seconds * 1000).toLocaleDateString('es-AR') : 'N/A'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>

      <TransferModal show={showTransferModal} moneyStorageBanks={moneyStorageBanks} onClose={() => setShowTransferModal(false)} />
    </TailwindCard>
  );
}

// Componente TransferModal (Modal de Transferencia)
function TransferModal({ moneyStorageBanks, onClose, show }) {
  const { db, userId, appId, showMessage } = useContext(FirebaseContext);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (moneyStorageBanks.length > 0) {
      setFromAccount(moneyStorageBanks[0]);
      setToAccount(moneyStorageBanks[0]);
    }
  }, [moneyStorageBanks]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !amount || parseFloat(amount) <= 0 || !description.trim()) {
      showMessage("Por favor, completa todos los campos válidos para la transferencia.", "danger");
      return;
    }
    if (fromAccount === toAccount) {
      showMessage("Las cuentas de origen y destino no pueden ser las mismas.", "danger");
      return;
    }
    if (!db || !userId) return;

    try {
      // Débito de la cuenta de origen
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/personalWalletTransactions`), {
        description: `Transferencia a ${toAccount}: ${description.trim()}`,
        amount: parseFloat(amount),
        type: 'expense',
        account: fromAccount,
        date: serverTimestamp(),
      });

      // Crédito a la cuenta de destino
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/personalWalletTransactions`), {
        description: `Transferencia desde ${fromAccount}: ${description.trim()}`,
        amount: parseFloat(amount),
        type: 'income',
        account: toAccount,
        date: serverTimestamp(),
      });

      showMessage("Transferencia realizada exitosamente!", "success");
      onClose();
    } catch (error) {
      console.error("Error al realizar transferencia:", error);
      showMessage("Error al realizar la transferencia.", "danger");
    }
  };

  return (
    <TailwindModal show={show} onClose={onClose} title="Realizar Transferencia">
      <form onSubmit={handleTransfer}>
        <TailwindSelect label="Desde Cuenta:" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
          {moneyStorageBanks.map((b, index) => (
            <option key={index} value={b}>{b}</option>
          ))}
        </TailwindSelect>
        <TailwindSelect label="A Cuenta:" value={toAccount} onChange={(e) => setToAccount(e.target.value)} required>
          {moneyStorageBanks.map((b, index) => (
            <option key={index} value={b}>{b}</option>
          ))}
        </TailwindSelect>
        <TailwindInput
          label="Monto:"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          required
          inputMode="numeric" // Teclado numérico
          pattern="[0-9]*"   // Patrón para números
        />
        <TailwindInput
          label="Descripción:"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <div className="flex justify-end gap-2 mt-6">
          <TailwindButton variant="secondary" onClick={onClose}>
            Cancelar
          </TailwindButton>
          <TailwindButton variant="primary" type="submit">
            Transferir
          </TailwindButton>
        </div>
      </form>
    </TailwindModal>
  );
}


// Componente FutureExpenses (Gastos Futuros)
function FutureExpenses() {
  const { db, userId, appId, showMessage } = useContext(FirebaseContext);
  const [futureItems, setFutureItems] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [recurrence, setRecurrence] = useState('one_time');
  const [startDate, setStartDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [allCommunityWallets, setAllCommunityWallets] = useState([]);

  const fixedRecurringTypes = ['Alquiler', 'Edesur', 'Metrogas', 'Expensas'];

  useEffect(() => {
    if (!db || !userId) return;

    const q = query(collection(db, `artifacts/${appId}/users/${userId}/futureExpenses`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filtrar elementos futuros para mostrar solo deudas de tarjeta de crédito que involucren al usuario actual
      const filteredItems = items.filter(item => {
        if (item.type === 'community_credit_card_debt') {
          return item.reimbursements && item.reimbursements.some(reimbursement =>
            reimbursement.fromId === userId || reimbursement.toId === userId
          );
        }
        return true; // Mantener otros tipos de gastos futuros
      });
      setFutureItems(filteredItems);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener gastos futuros:", error);
      showMessage("Error al cargar los gastos futuros.", "danger");
      setLoading(false);
    });

    const qCommunityWallets = query(collection(db, `artifacts/${appId}/public/data/communityWallets`));
    const unsubscribeCommunityWallets = onSnapshot(qCommunityWallets, async (snapshot) => {
      const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const expensesPromises = walletsData.map(async (wallet) => {
        const qExpenses = query(collection(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}/expenses`));
        const expenseSnapshot = await getDocs(qExpenses);
        return expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      });
      const allExpenses = await Promise.all(expensesPromises);
      const walletsWithExpenses = walletsData.map((wallet, index) => ({
        ...wallet,
        expenses: allExpenses[index],
      }));
      setAllCommunityWallets(walletsWithExpenses);
    }, (error) => {
      console.error("Error al obtener todas las billeteras comunitarias:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeCommunityWallets();
    };
  }, [db, userId, appId, showMessage]);

  useEffect(() => {
    if (!db || !userId || allCommunityWallets.length === 0) return;

    const aggregateCreditCardDebts = async () => {
      const creditCardDebtsByMonthAndCard = {}; // { 'YYYY-MM': { 'BANK - CARD_TYPE': { amount: total, reimbursements: [] } } }

      for (const wallet of allCommunityWallets) {
        const membersInWallet = wallet.members || [];
        const isMember = membersInWallet.some(m => m.id === userId);

        if (isMember) {
          const qExpenses = query(
            collection(db, `artifacts/${appId}/public/data/communityWallets/${wallet.id}/expenses`),
            where('type', '==', 'credit_card'),
            where('isSettled', '==', false)
          );
          const expenseSnapshot = await getDocs(qExpenses);
          expenseSnapshot.docs.forEach(expenseDoc => {
            const expenseData = expenseDoc.data();
            console.log("FutureExpenses: Procesando gasto de tarjeta:", expenseData);

            // Ensure splitDetails[userId] is a valid number
            const userShare = parseFloat(expenseData.splitDetails?.[userId]) || 0;
            if (userShare === 0 && expenseData.payerId !== userId) {
              console.log("FutureExpenses: Usuario no involucrado en este gasto o su participación es 0. Saltando.");
              return; // Skip if user is not involved or their share is 0
            }

            const expenseDate = expenseData.date && expenseData.date.seconds ? new Date(expenseData.date.seconds * 1000) : new Date();

            const dueDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 1);
            const dueMonthYear = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;

            const bankName = expenseData.bank || 'Desconocido';
            const cardType = expenseData.cardType || 'General';
            const key = `${bankName} - ${cardType}`;

            if (!creditCardDebtsByMonthAndCard[dueMonthYear]) {
              creditCardDebtsByMonthAndCard[dueMonthYear] = {};
            }
            if (!creditCardDebtsByMonthAndCard[dueMonthYear][key]) {
              creditCardDebtsByMonthAndCard[dueMonthYear][key] = { amount: 0, reimbursements: [] };
            }

            creditCardDebtsByMonthAndCard[dueMonthYear][key].amount += userShare;

            const payer = membersInWallet.find(m => m.id === expenseData.payerId);
            const payerName = payer ? payer.name : 'Desconocido';

            for (const memberId in expenseData.splitDetails) {
              const memberShare = parseFloat(expenseData.splitDetails[memberId]) || 0;

              if (expenseData.payerId === userId && memberId !== userId && memberShare > 0) {
                const participant = membersInWallet.find(m => m.id === memberId);
                const participantName = participant ? participant.name : 'Desconocido';
                creditCardDebtsByMonthAndCard[dueMonthYear][key].reimbursements.push({
                  type: 'owed_to_you',
                  from: participantName,
                  fromId: memberId,
                  toId: userId,
                  amount: memberShare,
                  description: expenseData.description,
                  walletName: wallet.name,
                });
              }
              else if (memberId === userId && expenseData.payerId !== userId && memberShare > 0) {
                creditCardDebtsByMonthAndCard[dueMonthYear][key].reimbursements.push({
                  type: 'you_owe',
                  to: payerName,
                  fromId: userId,
                  toId: expenseData.payerId,
                  amount: memberShare,
                  description: expenseData.description,
                  walletName: wallet.name,
                });
              }
            }
          });
        }
      }
      console.log("FutureExpenses: creditCardDebtsByMonthAndCard final:", creditCardDebtsByMonthAndCard);

      const batch = writeBatch(db);
      const futureExpensesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/futureExpenses`);

      const existingCommunityCreditCardDebts = futureItems.filter(item => item.type === 'community_credit_card_debt');
      console.log("FutureExpenses: Deudas de tarjeta existentes:", existingCommunityCreditCardDebts);

      existingCommunityCreditCardDebts.forEach(existingItem => {
        const itemStartDate = existingItem.startDate && existingItem.startDate.toDate ? existingItem.startDate.toDate() : new Date();
        const itemMonthYear = `${itemStartDate.getFullYear()}-${String(itemStartDate.getMonth() + 1).padStart(2, '0')}`;
        const itemKey = existingItem.description.replace('Deuda Tarjeta Crédito (Comunitaria) - ', '');

        const hasRelevantDebt = creditCardDebtsByMonthAndCard[itemMonthYear] &&
                                creditCardDebtsByMonthAndCard[itemMonthYear][itemKey] &&
                                creditCardDebtsByMonthAndCard[itemMonthYear][itemKey].reimbursements.length > 0;

        if (!hasRelevantDebt) {
          console.log("FutureExpenses: Eliminando deuda de tarjeta existente (no relevante):", existingItem.id);
          batch.delete(doc(db, `artifacts/${appId}/users/${userId}/futureExpenses`, existingItem.id));
        }
      });

      for (const monthYear in creditCardDebtsByMonthAndCard) {
        for (const key in creditCardDebtsByMonthAndCard[monthYear]) {
          const { amount, reimbursements } = creditCardDebtsByMonthAndCard[monthYear][key];
          const description = `Deuda Tarjeta Crédito (Comunitaria) - ${key}`;
          const [year, month] = monthYear.split('-').map(Number);
          const startDate = new Date(year, month - 1, 1);

          if (reimbursements.length > 0) {
            const existingItem = existingCommunityCreditCardDebts.find(item =>
              item.description === description &&
              item.startDate && item.startDate.toDate &&
              item.startDate.toDate().getFullYear() === startDate.getFullYear() &&
              item.startDate.toDate().getMonth() === startDate.getMonth()
            );

            const debtItemData = {
              description: description,
              amount: amount,
              type: 'community_credit_card_debt',
              recurrence: 'one_time',
              startDate: startDate, // This will be a Date object, Firestore will convert it to Timestamp
              sourceWalletId: 'all_community_wallets',
              reimbursements: reimbursements,
              createdAt: serverTimestamp(),
            };

            if (existingItem) {
              console.log("FutureExpenses: Actualizando deuda de tarjeta existente:", existingItem.id, debtItemData);
              batch.update(doc(db, `artifacts/${appId}/users/${userId}/futureExpenses`, existingItem.id), debtItemData);
            } else {
              console.log("FutureExpenses: Añadiendo nueva deuda de tarjeta:", debtItemData);
              batch.set(doc(collection(db, `artifacts/${appId}/users/${userId}/futureExpenses`)), debtItemData);
            }
          }
        }
      }

      await batch.commit();
      console.log("FutureExpenses: Operaciones de batch completadas.");
    };

    aggregateCreditCardDebts();
  }, [db, userId, appId, allCommunityWallets, futureItems]); // Dependencias actualizadas

  const handleAddFutureItem = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0 || !startDate) {
      showMessage("Por favor, completa todos los campos para el gasto futuro.", "danger");
      return;
    }
    if (!db || !userId) {
      showMessage("Error: Datos de usuario no disponibles.", "danger");
      return;
    }

    try {
      if (recurrence === 'recurring_fixed' && fixedRecurringTypes.includes(description.trim())) {
        const existingFixedItem = futureItems.find(item =>
          item.recurrence === 'recurring_fixed' && item.description === description.trim()
        );

        if (existingFixedItem) {
          await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/futureExpenses`, existingFixedItem.id), {
            amount: parseFloat(amount),
            startDate: new Date(startDate),
            lastModifiedDate: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, `artifacts/${appId}/users/${userId}/futureExpenses`), {
            description: description.trim(),
            amount: parseFloat(amount),
            type: type,
            recurrence: recurrence,
            startDate: new Date(startDate),
            createdAt: serverTimestamp(),
            lastModifiedDate: serverTimestamp(),
          });
        }
      } else {
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/futureExpenses`), {
          description: description.trim(),
          amount: parseFloat(amount),
          type: type,
          recurrence: recurrence,
          startDate: new Date(startDate),
          createdAt: serverTimestamp(),
        });
      }

      setDescription('');
      setAmount('');
      setStartDate('');
      showMessage("Gasto/Ingreso futuro añadido.", "success");
    } catch (error) {
      console.error("Error al añadir elemento futuro:", error);
      showMessage("Error al añadir el elemento futuro.", "danger");
    }
  };

  const calculateMonthlyBalance = (monthYear) => {
    const [year, month] = monthYear.split('-').map(Number);
    let totalIncome = 0;
    let totalExpense = 0;

    futureItems.forEach(item => {
      const itemStartDate = item.startDate && item.startDate.seconds ? new Date(item.startDate.seconds * 1000) : new Date();
      const itemStartMonth = itemStartDate.getMonth() + 1;
      const itemStartYear = itemStartDate.getFullYear();

      // Consider items that started before or in the selected month/year
      if (itemStartYear < year || (itemStartYear === year && itemStartMonth <= month)) {
        if (item.type === 'income') {
          totalIncome += item.amount;
        } else if (item.type === 'expense') {
          totalExpense += item.amount;
        } else if (item.type === 'community_credit_card_debt') {
          totalExpense += item.amount;
        }
      }
    });

    return totalIncome - totalExpense;
  };

  const currentMonthBalance = calculateMonthlyBalance(selectedMonth);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-600">Cargando gastos futuros...</p>
      </div>
    );
  }

  return (
    <TailwindCard className="rounded-xl border-0">
      <h2 className="text-center mb-6 text-blue-600 font-bold text-3xl">Planificación de Gastos Futuros (Personal)</h2>

      {/* Formulario para Añadir Elemento Futuro */}
      <TailwindCard className="bg-blue-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Añadir Ingreso/Gasto Futuro</h3>
        <form onSubmit={handleAddFutureItem}>
          <TailwindInput
            label="Descripción:"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required={recurrence !== 'recurring_fixed'}
            list={recurrence === 'recurring_fixed' ? "fixed-recurring-types" : undefined}
          />
          {recurrence === 'recurring_fixed' && (
            <datalist id="fixed-recurring-types">
              {fixedRecurringTypes.map(type => (
                <option key={type} value={type} />
              ))}
            </datalist>
          )}

          <TailwindInput
            label="Monto:"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            required
            inputMode="numeric" // Teclado numérico
            pattern="[0-9]*"   // Patrón para números
          />
          <TailwindSelect label="Tipo:" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </TailwindSelect>
          <TailwindSelect
            label="Recurrencia:"
            value={recurrence}
            onChange={(e) => {
              setRecurrence(e.target.value);
              if (e.target.value === 'recurring_fixed' && !fixedRecurringTypes.includes(description)) {
                setDescription('');
              } else if (e.target.value !== 'recurring_fixed' && fixedRecurringTypes.includes(description)) {
                setDescription('');
              }
            }}
          >
            <option value="one_time">Única vez</option>
            <option value="monthly">Mensual</option>
            <option value="recurring_fixed">Gasto Fijo Recurrente (Alquiler, Edesur, etc.)</option>
          </TailwindSelect>
          <TailwindInput
            label="Fecha de inicio (mes y año):"
            type="month"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <TailwindButton variant="primary" type="submit" className="w-full mt-4">
            Añadir Elemento Futuro
          </TailwindButton>
        </form>
      </TailwindCard>

      {/* Sección de Balance Mensual */}
      <TailwindCard className="bg-green-100 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Balance Mensual Proyectado</h3>
        <div className="flex items-center gap-3 mb-4">
          <label className="font-semibold text-gray-700">Seleccionar Mes:</label>
          <TailwindInput type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-auto" />
        </div>
        <p className={`text-center text-4xl font-bold p-3 rounded-lg ${currentMonthBalance >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          Saldo Proyectado: ${currentMonthBalance.toFixed(2)}
        </p>
      </TailwindCard>

      {/* Lista de Elementos Futuros */}
      <TailwindCard className="bg-purple-50 p-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Elementos Futuros Registrados</h3>
        {futureItems.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No hay elementos futuros registrados.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {futureItems.map((item) => (
              <li key={item.id} className="bg-white shadow-sm rounded-lg mb-2 p-4"> {/* This is line 2209 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <span className="font-medium text-gray-800">{item.description}</span>
                  <span className={`font-bold text-xl mt-2 sm:mt-0 ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    ${item.amount.toFixed(2)}
                  </span>
                </div>
                <p className={`text-sm font-semibold mt-1 ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Recurrencia: {item.recurrence === 'one_time' ? 'Única vez' :
                                  item.recurrence === 'monthly' ? 'Mensual' : 'Fijo Recurrente'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Desde: {item.startDate ? new Date(item.startDate.seconds * 1000).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
                {item.type === 'community_credit_card_debt' && item.reimbursements && item.reimbursements.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-base font-semibold text-gray-800 mb-2">Reembolsos para esta tarjeta:</h4>
                    <ul className="list-disc list-inside ml-4 text-sm text-gray-600">
                      {item.reimbursements.map((reimbursement, idx) => (
                        <li key={idx}>
                          {reimbursement.type === 'owed_to_you' ? (
                            <span>{reimbursement.from} te debe ${reimbursement.amount.toFixed(2)} (por "{reimbursement.description}" en {reimbursement.walletName})</span>
                          ) : (
                            <span>Debes ${reimbursement.amount.toFixed(2)} a {reimbursement.to} (por "{reimbursement.description}" en {reimbursement.walletName})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>
    </TailwindCard>
  );
}

// Componente BankManagement (Gestión de Bancos)
function BankManagement() {
  const { db, userId, userName, appId, showMessage } = useContext(FirebaseContext);
  const [banks, setBanks] = useState([]);
  const [newBankName, setNewBankName] = useState('');
  const [newBankType, setNewBankType] = useState('money_storage');
  const [newBankOwner, setNewBankOwner] = useState(userId);
  const [loading, setLoading] = useState(true);
  const [communityMembers, setCommunityMembers] = useState([]);

  useEffect(() => {
    if (!db || !userId) return;

    const q = query(collection(db, `artifacts/${appId}/users/${userId}/banks`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBanks = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, type: doc.data().type, ownerId: doc.data().ownerId || userId }));
      setBanks(fetchedBanks);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener bancos:", error);
      showMessage("Error al cargar los bancos.", "danger");
      setLoading(false);
    });

    const qCommunityWallets = query(collection(db, `artifacts/${appId}/public/data/communityWallets`));
    const unsubscribeCommunityWallets = onSnapshot(qCommunityWallets, (snapshot) => {
      const allMembers = new Set();
      snapshot.docs.forEach(walletDoc => {
        const walletData = walletDoc.data();
        if (walletData.members) {
          walletData.members.forEach(member => {
            allMembers.add(JSON.stringify(member));
          });
        }
      });
      const uniqueMembers = Array.from(allMembers).map(memberStr => JSON.parse(memberStr));
      setCommunityMembers(uniqueMembers);
    }, (error) => {
      console.error("Error al obtener miembros de la comunidad:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeCommunityWallets();
    };
  }, [db, userId, appId, showMessage]);

  const handleAddBank = async (e) => {
    e.preventDefault();
    if (!newBankName.trim()) {
      showMessage("El nombre del banco no puede estar vacío.", "danger");
      return;
    }
    if (!db || !userId) return;

    try {
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/banks`), {
        name: newBankName.trim(),
        type: newBankType,
        ownerId: newBankOwner,
        createdAt: serverTimestamp(),
      });
      setNewBankName('');
      showMessage("Banco añadido exitosamente!", "success");
    } catch (error) {
      console.error("Error al añadir banco:", error);
      showMessage("Error al añadir el banco.", "danger");
    }
  };

  const handleDeleteBank = async (bankId) => {
    if (!db || !userId) return;
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/banks`, bankId));
      showMessage("Banco eliminado.", "success");
    } catch (error) {
      console.error("Error al eliminar banco:", error);
      showMessage("Error al eliminar el banco.", "danger");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-600">Cargando bancos...</p>
      </div>
    );
  }

  return (
    <TailwindCard className="rounded-xl border-0">
      <h2 className="text-center mb-6 text-blue-600 font-bold text-3xl">Gestión de Bancos</h2>

      <TailwindCard className="bg-blue-50 p-6 mb-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Añadir Nuevo Banco</h3>
        <form onSubmit={handleAddBank}>
          <TailwindInput
            label="Nombre del Banco:"
            type="text"
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            required
          />
          <TailwindSelect label="Tipo de Banco:" value={newBankType} onChange={(e) => setNewBankType(e.target.value)}>
            <option value="money_storage">Banco para Almacenamiento de Dinero</option>
            <option value="credit_card">Tarjeta de Crédito</option>
          </TailwindSelect>
          <TailwindSelect label="Propietario del Banco:" value={newBankOwner} onChange={(e) => setNewBankOwner(e.target.value)}>
            <option value={userId}>Yo ({userName || userId.substring(0, 4)}...)</option>
            {communityMembers.filter(member => member.id !== userId).map(member => (
              <option key={member.id} value={member.id}>{member.name} ({member.id.substring(0, 4)}...)</option>
            ))}
          </TailwindSelect>
          <TailwindButton variant="primary" type="submit" className="w-full mt-4">
            Añadir Banco
          </TailwindButton>
        </form>
      </TailwindCard>

      <TailwindCard className="bg-purple-50 p-6 shadow-sm rounded-lg border-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Tus Bancos Guardados</h3>
        {banks.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No tienes bancos guardados. ¡Añade uno!</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {banks.map((bank) => (
              <li key={bank.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 bg-white shadow-sm rounded-lg mb-2">
                <div>
                  <span className="font-medium text-gray-800">{bank.name}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Tipo: {bank.type === 'money_storage' ? 'Almacenamiento de Dinero' : 'Tarjeta de Crédito'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Propietario: {communityMembers.find(m => m.id === bank.ownerId)?.name || 'Desconocido'} ({bank.ownerId === userId ? 'Tú' : bank.ownerId.substring(0, 4)}...)
                  </p>
                </div>
                <TailwindButton
                  variant="danger"
                  className="px-4 py-2 text-sm mt-3 sm:mt-0"
                  onClick={() => handleDeleteBank(bank.id)}
                >
                  Eliminar
                </TailwindButton>
              </li>
            ))}
          </ul>
        )}
      </TailwindCard>
    </TailwindCard>
  );
}

// Componente InviteMemberModal (Modal para Invitar Miembro)
function InviteMemberModal({ walletId, walletName, onClose, show }) {
  const { showMessage } = useContext(FirebaseContext);
  const inviteLink = `${window.location.origin}?joinWalletId=${walletId}`;

  const handleCopyLink = () => {
    // Usar document.execCommand para compatibilidad en iframes
    const tempInput = document.createElement('textarea');
    tempInput.value = inviteLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showMessage("Enlace copiado al portapapeles.", "success");
    } catch (err) {
      console.error('Error al copiar el enlace (execCommand):', err);
      showMessage("Error al copiar el enlace.", "danger");
    } finally {
      document.body.removeChild(tempInput);
    }
  };

  const handleShareWhatsApp = () => {
    const message = `¡Hola! Te invito a unirte a mi billetera comunitaria "${walletName}" en el Gestor de Gastos. Haz clic en este enlace para unirte: ${inviteLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <TailwindModal show={show} onClose={onClose} title={`Invitar Miembro a "${walletName}"`}>
      <p className="text-center text-gray-700 mb-4">Comparte este enlace con la persona que quieres invitar:</p>
      <div className="bg-gray-50 p-4 rounded-lg text-wrap text-center font-mono mb-6 border border-gray-300 break-words">
        {inviteLink}
      </div>
      <div className="flex flex-col gap-3">
        <TailwindButton variant="primary" onClick={handleCopyLink}>
          Copiar Enlace
        </TailwindButton>
        <TailwindButton variant="success" onClick={handleShareWhatsApp}>
          Compartir por WhatsApp
        </TailwindButton>
        <TailwindButton variant="secondary" onClick={onClose}>
          Cerrar
        </TailwindButton>
      </div>
    </TailwindModal>
  );
}

// Componente JoinWalletModal (Modal para Unirse a Billetera)
function JoinWalletModal({ walletId, onClose, onJoinSuccess, show }) {
  const { db, userId, userName, appId, showMessage } = useContext(FirebaseContext);
  const [walletName, setWalletName] = useState('Cargando...');
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !walletId || !userId) {
      console.log("JoinWalletModal: db, walletId o userId no disponibles. Saliendo de useEffect.");
      return;
    }
    console.log("JoinWalletModal: Iniciando useEffect. walletId:", walletId, "userId:", userId);

    const walletRef = doc(db, `artifacts/${appId}/public/data/communityWallets/${walletId}`);
    const unsubscribe = onSnapshot(walletRef, (docSnap) => {
      console.log("JoinWalletModal: onSnapshot recibido. docSnap.exists():", docSnap.exists());
      if (docSnap.exists()) {
        const walletData = docSnap.data();
        setWalletName(walletData.name);
        console.log("JoinWalletModal: Datos de billetera:", walletData);
        if (walletData.members && walletData.members.some(m => m.id === userId)) {
          console.log("JoinWalletModal: Usuario ya es miembro.");
          setIsMember(true);
          showMessage("Ya eres miembro de esta billetera.", "success");
        } else {
          console.log("JoinWalletModal: Usuario NO es miembro.");
          setIsMember(false);
        }
      } else {
        console.log("JoinWalletModal: Billetera no encontrada.");
        setWalletName('Billetera no encontrada');
        showMessage("La billetera a la que intentas unirte no existe.", "danger");
      }
      setLoading(false);
      console.log("JoinWalletModal: Loading establecido a false.");
    }, (error) => {
      console.error("JoinWalletModal: Error al obtener billetera para unirse:", error);
      showMessage("Error al cargar la información de la billetera.", "danger");
      setLoading(false);
    });

    return () => {
      console.log("JoinWalletModal: Limpiando onSnapshot.");
      unsubscribe();
    };
  }, [db, walletId, userId, userName, appId, showMessage]); // Añadido userName a las dependencias

  const handleJoinWallet = async () => {
    if (!db || !walletId || !userId) {
      console.error("handleJoinWallet: db, walletId o userId no disponibles.");
      showMessage("Error: Datos de usuario no disponibles para unirse a la billetera.", "danger");
      return;
    }
    console.log("handleJoinWallet: Intentando unirse a la billetera. userId:", userId, "userName:", userName);

    try {
      const walletRef = doc(db, `artifacts/${appId}/public/data/communityWallets/${walletId}`);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        const walletData = walletSnap.data();
        const currentMembers = walletData.members || [];
        
        if (!currentMembers.some(m => m.id === userId)) {
          const updatedMembers = [...currentMembers, { id: userId, name: userName || 'Tú' }];
          console.log("handleJoinWallet: Añadiendo nuevo miembro:", { id: userId, name: userName || 'Tú' });
          await updateDoc(walletRef, { members: updatedMembers });
          showMessage(`Te has unido a la billetera "${walletData.name}" exitosamente!`, "success");
          console.log("handleJoinWallet: updateDoc exitoso.");
          onJoinSuccess(); // Llama a la función de éxito para cerrar el modal y cambiar la vista
        } else {
          console.log("handleJoinWallet: Usuario ya era miembro.");
          showMessage("Ya eres miembro de esta billetera.", "info");
          onJoinSuccess(); // Si ya es miembro, también considera que fue un "éxito" y cierra el modal.
        }
      } else {
        console.error("handleJoinWallet: La billetera no existe.");
        showMessage("La billetera no existe.", "danger");
      }
    } catch (error) {
      console.error("handleJoinWallet: Error al unirse a la billetera:", error);
      showMessage("Error al unirse a la billetera.", "danger");
    }
  };

  if (loading) {
    return (
      <TailwindModal show={show} onClose={onClose} title="Unirse a Billetera Comunitaria">
        <p className="text-xl font-semibold text-gray-600 text-center">Cargando información de la billetera...</p>
      </TailwindModal>
    );
  }

  return (
    <TailwindModal show={show} onClose={onClose} title="Unirse a Billetera Comunitaria">
      <p className="text-xl text-gray-700 text-center mb-6">
        ¿Quieres unirte a la billetera: <span className="font-semibold text-blue-600">{walletName}</span>?
      </p>
      {isMember ? (
        <p className="text-center text-green-600 font-semibold mb-6 p-3 bg-green-100 rounded-lg">Ya eres miembro de esta billetera.</p>
      ) : (
        <div className="flex justify-center mt-6">
          <TailwindButton variant="primary" onClick={handleJoinWallet}>
            Unirse a la Billetera
          </TailwindButton>
        </div>
      )}
      <div className="flex justify-center mt-4">
        <TailwindButton variant="secondary" onClick={onClose}>
          Cerrar
        </TailwindButton>
      </div>
    </TailwindModal>
  );
}

// Exportar el componente principal de la aplicación
export default App;
