'use client';
import { useState, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const FORM_TYPES = [
  { value: 'patient_registration', label: 'Patient Registration Form', icon: '📋' },
  { value: 'prescription', label: 'Prescription / Rx', icon: '💊' },
  { value: 'lab_report', label: 'Lab Report', icon: '🔬' },
  { value: 'referral_letter', label: 'Referral Letter', icon: '📨' },
];

interface OcrResult {
  rawText: string;
  formType: string;
  fields: Record<string, string>;
  confidence: number;
}

export default function OcrPage() {
  const [formType, setFormType] = useState('patient_registration');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
      setSaved(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      setError('Could not access camera. Please use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        setImage(file);
        setPreview(canvas.toDataURL('image/jpeg'));
        setResult(null);
        setSaved(false);
      }
    }, 'image/jpeg', 0.9);
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const scanImage = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('formType', formType);

    try {
      const res = await fetch(`${API}/ocr/scan`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());
      const data: OcrResult = await res.json();
      setResult(data);
      setEditedFields({ ...data.fields });
    } catch (err: any) {
      setError(err.message || 'OCR scan failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
  };

  const saveAsPatient = async () => {
    try {
      const f = editedFields;
      const res = await fetch(`${API}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name,
          phone: f.phone?.replace(/\D/g, ''),
          dob: f.dob || '2000-01-01',
          gender: f.gender?.toUpperCase()?.startsWith('M') ? 'MALE' : 'FEMALE',
          bloodGroup: f.bloodGroup,
          address: f.address,
          aadhaar: f.aadhaar?.replace(/\s/g, ''),
          emergencyContact: f.emergencyContact?.replace(/\D/g, ''),
          email: f.email,
          referredBy: f.referredBy,
          registrationSource: 'PAPER_OCR',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save patient');
    }
  };

  const fieldLabels: Record<string, string> = {
    name: 'Patient Name',
    phone: 'Phone Number',
    dob: 'Date of Birth',
    age: 'Age',
    gender: 'Gender',
    bloodGroup: 'Blood Group',
    address: 'Address',
    aadhaar: 'Aadhaar Number',
    emergencyContact: 'Emergency Contact',
    emergencyContactName: 'Emergency Contact Name',
    email: 'Email',
    referredBy: 'Referred By',
    occupation: 'Occupation',
    maritalStatus: 'Marital Status',
    allergies: 'Allergies',
    existingConditions: 'Existing Conditions',
    insuranceProvider: 'Insurance Provider',
    insurancePolicyNumber: 'Policy Number',
    fatherOrHusbandName: 'Father/Husband Name',
    religion: 'Religion',
    nationality: 'Nationality',
    patientName: 'Patient Name',
    patientAge: 'Patient Age',
    patientGender: 'Patient Gender',
    doctorName: 'Doctor Name',
    date: 'Date',
    diagnosis: 'Diagnosis',
    vitals: 'Vitals',
    medicines: 'Medicines',
    notes: 'Notes',
    followUp: 'Follow Up',
    testName: 'Test Name',
    labName: 'Lab Name',
    sampleCollectedDate: 'Sample Collected Date',
    sampleType: 'Sample Type',
    testValues: 'Test Values',
    impression: 'Impression',
    referringDoctor: 'Referring Doctor',
    referredTo: 'Referred To',
    reason: 'Reason',
    history: 'Clinical History',
    currentMedications: 'Current Medications',
    investigations: 'Investigations Done',
    urgency: 'Urgency',
    rawText: 'Raw Text',
    extractedText: 'Extracted Text',
    extractedLines: 'Extracted Text (auto)',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <a href="/" className="text-blue-600 hover:underline text-sm">← Home</a>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">📄 Paper Form OCR Scanner</h1>
          <p className="text-gray-500 mt-1">
            Upload or photograph a physical form — OCR will extract the data automatically
          </p>
        </div>

        {/* Step 1: Select Form Type */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Step 1: Select Form Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FORM_TYPES.map((ft) => (
              <button
                key={ft.value}
                onClick={() => { setFormType(ft.value); setResult(null); setSaved(false); }}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  formType === ft.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{ft.icon}</div>
                <div className="text-sm font-medium">{ft.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Upload or Capture */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Step 2: Upload Image or Take Photo</h2>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              📁 Upload Image
            </button>
            <button
              onClick={cameraActive ? capturePhoto : startCamera}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              {cameraActive ? '📸 Capture Photo' : '📷 Open Camera'}
            </button>
            {cameraActive && (
              <button
                onClick={stopCamera}
                className="py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ✕
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Camera View */}
          {cameraActive && (
            <div className="mb-4 rounded-lg overflow-hidden border">
              <video ref={videoRef} autoPlay playsInline className="w-full" />
            </div>
          )}

          {/* Image Preview */}
          {preview && !cameraActive && (
            <div className="mb-4">
              <img
                src={preview}
                alt="Form preview"
                className="max-h-80 rounded-lg border mx-auto"
              />
            </div>
          )}

          {/* Scan Button */}
          {image && (
            <button
              onClick={scanImage}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white text-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning... (this may take a moment)
                </span>
              ) : (
                '🔍 Scan with OCR'
              )}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Step 3: Results */}
        {result && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Step 3: Review & Edit Extracted Data</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.confidence > 80
                    ? 'bg-green-100 text-green-700'
                    : result.confidence > 50
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                Confidence: {Math.round(result.confidence)}%
              </span>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(editedFields)
                .filter(([key]) => key !== 'rawText')
                .map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {fieldLabels[key] || key}
                    </label>
                    {value.length > 60 ? (
                      <textarea
                        value={value}
                        onChange={(e) => updateField(key, e.target.value)}
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateField(key, e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                ))}
            </div>

            {/* Raw text toggle */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                View raw OCR text
              </summary>
              <pre className="mt-2 bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap border">
                {result.rawText}
              </pre>
            </details>

            {/* Save Actions */}
            <div className="flex gap-3">
              {formType === 'patient_registration' && (
                <button
                  onClick={saveAsPatient}
                  disabled={saved}
                  className={`flex-1 py-3 rounded-lg font-bold text-white ${
                    saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saved ? '✅ Patient Saved!' : '💾 Save as Patient'}
                </button>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(editedFields, null, 2));
                }}
                className="py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium"
              >
                📋 Copy Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
