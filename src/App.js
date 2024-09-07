import { Check, ContentCopy } from '@mui/icons-material';
import { Button, IconButton, Snackbar, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import './App.scss';

function App() {
  const [poPrice, setPOPrice] = useState(0);
  const [discountForPOPrice, setDiscountForPOPrice] = useState('');
  const [tableData, setTableData] = useState();
  const [showOnCopyFeedback, setShowOnCopyFeedback] = useState(false);

  async function calculateDiscount() {
    const bomLines = await navigator.clipboard.readText();
    if (!validateBOM(bomLines)) return alert('Please copy the BOM from NAV and try again!');
    let totalCost = getTotalCost(bomLines);

    const _discountForPOPrice = ((poPrice / totalCost - 1) * -100).toFixed(5);

    setDiscountForPOPrice(_discountForPOPrice);
    mapTableData(bomLines, _discountForPOPrice);
  }

  function mapTableData(bomLines, _discountForPOPrice) {
    const matrix = getMatrix(bomLines);
    const indexes = {
      code: findFieldIndex(matrix[0], 'No.'),
      description: findFieldIndex(matrix[0], 'Description'),
      quantity: findFieldIndex(matrix[0], 'Quantity'),
      unitPrice: findFieldIndex(matrix[0], 'Unit Price Excl. VAT'),
      lineDiscount: findFieldIndex(matrix[0], 'Line Discount %'),
      discountedUnitPrice: findFieldIndex(matrix[0], 'Discounted Unit Price'),
      lineAmount: findFieldIndex(matrix[0], 'Line Amount Excl. VAT'),
    };

    const columns = [
      { field: 'code', headerName: 'Code', align: 'left' },
      { field: 'description', headerName: 'Description', align: 'left' },
      { field: 'quantity', headerName: 'Quantity', align: 'right' },
      { field: 'unitPrice', headerName: 'Unit Price Excl. VAT', align: 'right', prefix: '€ ' },
      { field: 'lineDiscount', headerName: 'Line Discount %', align: 'right', suffix: ' %' },
      { field: 'discountedUnitPrice', headerName: 'Discounted Unit Price', align: 'right', prefix: '€ ' },
      { field: 'lineAmount', headerName: 'Line Amount Excl. VAT', align: 'right', prefix: '€ ' },
    ];

    const rows = matrix
      .filter((row, index) => index > 0 && !!row[indexes.code])
      .map(row => ({
        code: row[indexes.code],
        description: row[indexes.description],
        quantity: row[indexes.quantity],
        unitPrice: row[indexes.unitPrice],
        lineDiscount: row[indexes.unitPrice] ? _discountForPOPrice : '',
        discountedUnitPrice: row[indexes.unitPrice] ? parseFloat((row[indexes.unitPrice] * _discountForPOPrice) / 100).toFixed(2) : '',
        lineAmount:
          row[indexes.quantity] && row[indexes.unitPrice]
            ? parseFloat((row[indexes.quantity] * (row[indexes.unitPrice] * (100 - _discountForPOPrice))) / 100).toFixed(2)
            : '',
      }));

    setTableData({
      columns,
      rows,
    });
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

    return totalCost.toFixed(2);
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

  function getTotalDiscountedPrice() {
    let total = 0;
    tableData?.rows.forEach(row => (total += parseFloat(row.lineAmount).toFixed(2) * 1 || 0));

    return total.toFixed(2);
  }

  // Handlers
  function handleOnChangePOPrice(e) {
    let value = e.target.value.replace(/^0+/, '');
    const dotSeparatorIndex = value.indexOf('.');
    value = dotSeparatorIndex > 0 ? value.substring(0, dotSeparatorIndex + 3) : value; // 2dp fixed, e.g. 1234.88

    setPOPrice(value);
  }

  async function handleOnCopyDiscount() {
    await navigator.clipboard.writeText(discountForPOPrice);
    setShowOnCopyFeedback(true);
    setDiscountForPOPrice();
    setTableData();
    setPOPrice('');
  }

  return (
    <>
      <div id='topbar'>
        <img className='topbarLeft' alt='Logo' src='https://joule.ie/wp-content/themes/Joule/assets/dist/img/joule_logo_white.svg' />
        <Typography variant='h3'>Joule BOM Calculator</Typography>
        <div className='topbarRight'></div>
      </div>
      <div className='App'>
        <Typography id='title' variant='h5'>
          Paste the rows from NAV, fill in the PO price below and click "Calculate Discount"
        </Typography>

        <div className='form flexRowBottom'>
          <TextField
            placeholder='PO Price'
            className='textField'
            type='number'
            variant='standard'
            label='PO Price'
            value={poPrice}
            onChange={handleOnChangePOPrice}
            autoFocus
          />
          <Button variant='outlined' className='buttonPrimary' onClick={calculateDiscount}>
            Calculate Discount
          </Button>
        </div>
        {discountForPOPrice && (
          <div className='flexRowCenter'>
            <Typography id='discount' variant='body1'>
              Discount: {discountForPOPrice}%
            </Typography>
            <Tooltip title='Copy discount to clipboard'>
              <IconButton size='large' className='buttonPrimary' onClick={handleOnCopyDiscount}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </div>
        )}

        {tableData && (
          <div className='tableContainer'>
            <Table id='dataTable' stickyHeader>
              <TableHead>
                <TableRow>
                  {tableData.columns.map(column => (
                    <TableCell key={column.field} align={column.align} className='onPrimaryColor'>
                      {column.headerName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.rows.map((row, index) => (
                  <TableRow key={index}>
                    {Object.keys(row).map((key, _index) => {
                      const { align, prefix, suffix } = tableData.columns.find((_, __index) => __index === _index);

                      return (
                        <TableCell key={key} align={align}>
                          {!!row[key] ? `${prefix || ''}${row[key]}${suffix || ''}` : ''}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {tableData && (
          <div id='dataTableFooter'>
            <Typography variant='body1'>Total</Typography>
            <Typography variant='body1'>€ {getTotalDiscountedPrice()}</Typography>
          </div>
        )}
        <Snackbar
          open={showOnCopyFeedback}
          autoHideDuration={3000}
          onClose={() => setShowOnCopyFeedback(false)}
          message='Discount copied to your clipboard!'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          className='snackbar'
          action={<Check color='primary' />}
        />
      </div>
    </>
  );
}

export default App;
