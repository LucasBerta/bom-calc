import { useState } from 'react';
import './App.css';

function App() {
  const [poPrice, setPOPrice] = useState(0);
  const [bomLines, setBomLines] = useState();
  const [discountForPOPrice, setDiscountForPOPrice] = useState('');

  function calculateDiscount() {
    const lines = bomLines.split(/\n|\r/g);
    const matrix = lines.map(line => line.split(/\t/g));

    const indexes = {
      qty: matrix[0].findIndex(item => item === 'Quantity'),
      unitPrice: matrix[0].findIndex(item => item === 'Unit Price Excl. VAT'),
    };

    let totalCost = 0;
    matrix.forEach((line, index) => {
      if (index > 0) {
        totalCost += line[indexes.qty] * line[indexes.unitPrice];
      }
    });

    const _discountForPOPrice = ((poPrice / totalCost - 1) * -100).toFixed(5);
    setDiscountForPOPrice(_discountForPOPrice);
  }

  return (
    <div className='App'>
      <textarea id='bom-lines' rows={20} value={bomLines} onChange={e => setBomLines(e.target.value)}></textarea>
      <div>
        <input placeholder='PO Price' type='number' value={poPrice} onChange={e => setPOPrice(e.target.value)} />
        <button onClick={calculateDiscount}>Calculate Discount</button>
      </div>
      {discountForPOPrice && <div style={{ textAlign: 'center', width: '100%' }}>{discountForPOPrice}%</div>}
    </div>
  );
}

export default App;
