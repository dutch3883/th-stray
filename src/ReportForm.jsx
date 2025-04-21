// src/ReportForm.jsx
import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

export default function ReportForm({ user }) {
  const [numCats, setNumCats] = useState('1');
  const [type, setType] = useState('stray');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [desc, setDesc] = useState('');

  const functions = getFunctions(app);

  const handleSubmit = async () => {
    const createReport = httpsCallable(functions, 'createReport');
    await createReport({
      numberOfCats: numCats,
      type,
      contactPhone: phone,
      images,
      location: {
        lat: location?.lat,
        long: location?.lng,
        description: desc,
      },
    });
    alert('Report submitted!');
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    const readers = files.map(file => new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(setImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label>Number of Cats</label>
        <select value={numCats} onChange={e => setNumCats(e.target.value)}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n}>{n}</option>)}
          <option value="not sure">Not Sure</option>
        </select>
      </div>
      <div>
        <label>Type</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="stray">Stray</option>
          <option value="injured">Injured</option>
          <option value="sick">Sick</option>
          <option value="kitten">Kitten</option>
        </select>
      </div>
      <div>
        <label>Contact Phone</label>
        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div>
        <label>Images (max 3)</label>
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
      </div>
      <div>
        <label>Location Description</label>
        <input type="text" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div>
        <button onClick={() => window.location.href = '/select-location'} className="bg-yellow-500 text-white px-4 py-2 rounded">Pick Location</button>
        {location && <div>Selected: ({location.lat}, {location.lng})</div>}
      </div>
      <div>
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Submit Report</button>
      </div>
    </div>
  );
}
