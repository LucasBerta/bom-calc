import { useState } from 'react';
import './App.css';

function App() {
  const [poPrice, setPOPrice] = useState(0);
  const [discountForPOPrice, setDiscountForPOPrice] = useState('');
  const [tableData, setTableData] = useState();

  async function calculateDiscount() {
    const bomLines = await navigator.clipboard.readText();
    if (!validateBOM(bomLines)) return alert('Please copy the BOM from NAV and try again!');
    let totalCost = getTotalCost(bomLines);

    const _discountForPOPrice = ((poPrice / totalCost - 1) * -100).toFixed(5);
    setDiscountForPOPrice(_discountForPOPrice);
    mapTableData(bomLines);
  }

  function mapTableData(bomLines) {
    const matrix = getMatrix(bomLines);
    const indexes = {
      code: findFieldIndex(matrix[0], 'No.'),
      description: findFieldIndex(matrix[0], 'Description'),
      quantity: findFieldIndex(matrix[0], 'Quantity'),
      unitPrice: findFieldIndex(matrix[0], 'Unit Price Excl. VAT'),
    };
    const _tableData = matrix
      .filter((_, index) => index > 0)
      .map(row => ({
        Code: row[indexes.code],
        Description: row[indexes.description],
        Quantity: row[indexes.quantity],
        'Unit Price Excl. VAT': row[indexes.unitPrice],
      }));

    setTableData(_tableData);
  }

  function getTotalCost(bomLines) {
    const matrix = getMatrix(bomLines);
    const indexes = getIndexes(matrix[0]);
    let totalCost = 0;
    matrix.forEach((line, index) => {
      if (index > 0) {
        const amountToSum = line[indexes.qty] * removeComma(line[indexes.unitPrice]);
        totalCost += !!amountToSum ? amountToSum : 0;
      }
    });

    return totalCost;
  }

  function getMatrix(bomLines) {
    const lines = bomLines?.split(/\n|\r/g);
    const matrix = lines?.map(line => line.split(/\t/g));
    return matrix;
  }

  function getIndexes(row) {
    return { qty: findFieldIndex(row, 'Quantity'), unitPrice: findFieldIndex(row, 'Unit Price Excl. VAT') };
  }

  function findFieldIndex(row, field) {
    return row.findIndex(item => item === field);
  }

  function removeComma(value) {
    return value?.replaceAll(',', '');
  }

  function validateBOM(bom) {
    const matrix = getMatrix(bom);
    const indexes = getIndexes(matrix[0]);

    return indexes.qty > 0 && indexes.unitPrice > 0;
  }

  return (
    <div className='App'>
      Paste the BOM from NAV, fill in the PO price below and click "Calculate Discount"
      {tableData && (
        <div>
          <table>
            <thead>
              <tr>
                {Object.keys(tableData[0]).map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td>{row.Code}</td>
                  <td>{row.Description}</td>
                  <td>{row.Quantity}</td>
                  <td>{row['Unit Price Excl. VAT']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <input placeholder='PO Price' type='number' value={poPrice} onChange={e => setPOPrice(e.target.value)} />
        <button onClick={calculateDiscount}>Calculate Discount</button>
      </div>
      {discountForPOPrice && <div>{discountForPOPrice}%</div>}
    </div>
  );
}

export default App;
