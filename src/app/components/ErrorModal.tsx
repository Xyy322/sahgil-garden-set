type Props = {
  message: string;
  onClose: () => void;
};

export function ErrorModal({ message, onClose }: Props) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg text-center">
        <h2 className="text-lg font-semibold text-red-600 mb-3">Error</h2>
        <p className="text-stone-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}