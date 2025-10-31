
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useId } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<{ message: ToastMessage; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = message.type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = message.type === 'success' ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className={`flex items-center text-white p-4 rounded-lg shadow-lg ${bgColor} toast-anim`}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 text-sm font-medium">{message.message}</div>
        <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-full inline-flex items-center justify-center hover:bg-white hover:bg-opacity-20">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
         <style>{`
            .toast-anim {
                animation: toast-in 0.5s ease;
            }
            @keyframes toast-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
  );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useContext(ToastContext) as ToastProviderContextType;
    if (!toasts.length) return null;

    return (
        <div className="fixed top-5 right-5 z-[100] space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

interface ToastProviderProps {
  children: ReactNode;
}

interface ToastProviderContextType extends ToastContextType {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const value = { toasts, showToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};
