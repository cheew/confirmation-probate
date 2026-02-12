'use client';

interface HardStopScreenProps {
  message: string;
  onStartOver: () => void;
}

export default function HardStopScreen({ message, onStartOver }: HardStopScreenProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-red-800 mb-4">
          This case requires professional assistance
        </h2>
        <p className="text-red-700 mb-6">{message}</p>
        <p className="text-gray-600">
          We recommend consulting a solicitor experienced in Scottish Confirmation matters.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
        <h3 className="font-semibold text-gray-900 mb-3">Solicitor Referral</h3>
        <p className="text-sm text-gray-600 mb-4">
          The following organisations can help you find a solicitor:
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Law Society of Scotland</strong> — lawscot.org.uk — 0131 226 7411
          </li>
          <li>
            <strong>Citizens Advice Scotland</strong> — cas.org.uk — 0800 028 1456
          </li>
          <li>
            <strong>STEP Scotland</strong> (Society of Trust and Estate Practitioners)
          </li>
        </ul>
      </div>

      <button
        onClick={onStartOver}
        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
      >
        Start Over
      </button>
    </div>
  );
}
