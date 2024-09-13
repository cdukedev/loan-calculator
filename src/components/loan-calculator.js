import React, { useState, useEffect } from 'react';
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
const styles = {
container: {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px'
},
card: {
  backgroundColor: '#fff',
  padding: '20px',
  marginBottom: '20px',
  borderRadius: '8px',
  boxShadow:
    '0 4px 6px rgba(0, 0, 0, 0.1)'
},
title: {
  marginBottom: '10px',
  fontSize: '24px'
},
subtitle: {
  marginBottom: '10px',
  fontSize: '20px'
},
description: {
  marginBottom: '20px'
},
grid: {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
},
inputGroup: {
  display: 'flex',
  flexDirection: 'column'
},
label: {
  marginBottom: '5px'
},
input: {
  padding: '10px',
  fontSize: '16px'
},
readOnlyInput: {
  backgroundColor: '#f5f5f5',
  cursor: 'not-allowed'
},
smallText: {
  fontSize: '12px',
  color: '#666',
  marginTop: '5px'
},
table: {
  width: '100%',
  borderCollapse: 'collapse'
},
th: {
  padding: '10px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd'
},
td: {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center'
}
};

const LoanPaymentCalculator = () => {
  // State declarations
  const [loanAmount, setLoanAmount] = useState();
  const [interestRate, setInterestRate] = useState();
  const [originalLoanDuration, setOriginalLoanDuration] = useState();
  const [desiredLoanDuration, setDesiredLoanDuration] = useState();
  const [minimumPayment, setMinimumPayment] = useState(0);
  const [actualMinimumPaymentInput, setActualMinimumPaymentInput] = useState('');
  const [actualMinimumPayment, setActualMinimumPayment] = useState(0);
  const [autoMinPayment, setAutoMinPayment] = useState(0);
  const [autoMaxPayment, setAutoMaxPayment] = useState(0);
  const [customMaxPaymentInput, setCustomMaxPaymentInput] = useState('');
  const [customMaxPayment, setCustomMaxPayment] = useState(0);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [customMaxPaymentMonths, setCustomMaxPaymentMonths] = useState(0);
  const [adjustedMedianPayment, setAdjustedMedianPayment] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [originalTotalInterest, setOriginalTotalInterest] = useState(0);
  const [customTotalInterest, setCustomTotalInterest] = useState(0);

  useEffect(() => {
    if (
      loanAmount > 0 &&
      interestRate >= 0 &&
      originalLoanDuration > 0
    ) {
      calculateMinimumPayment();
    } else {
      setMinimumPayment(0);
    }
  }, [loanAmount, interestRate, originalLoanDuration]);

  useEffect(() => {
    if (
      loanAmount > 0 &&
      interestRate >= 0 &&
      desiredLoanDuration > 0
    ) {
      calculateAutoMinPayment();
    } else {
      setAutoMinPayment(0);
    }
  }, [loanAmount, interestRate, desiredLoanDuration]);

  useEffect(() => {
    if (
      loanAmount > 0 &&
      interestRate >= 0 &&
      desiredLoanDuration > 0 &&
      actualMinimumPayment > 0
    ) {
      calculateAutoMaxPayment();
    } else {
      setAutoMaxPayment(0);
    }
  }, [loanAmount, interestRate, desiredLoanDuration, actualMinimumPayment]);

  useEffect(() => {
    if (
      loanAmount > 0 &&
      interestRate >= 0 &&
      actualMinimumPayment > 0 &&
      desiredLoanDuration > 0 &&
      (autoMaxPayment > 0 || customMaxPayment > 0)
    ) {
      calculatePayments();
    } else {
      setPaymentSchedule([]);
    }
  }, [
    loanAmount,
    interestRate,
    actualMinimumPayment,
    desiredLoanDuration,
    autoMaxPayment,
    customMaxPayment
  ]);

  useEffect(() => {
    if (
      loanAmount > 0 &&
      interestRate >= 0 &&
      originalLoanDuration > 0
    ) {
      calculateOriginalLoanTotalInterest();
    } else {
      setOriginalTotalInterest(0);
    }
  }, [loanAmount, interestRate, originalLoanDuration]);

  const calculateMinimumPayment = () => {
    const monthlyRate = interestRate / 100 / 12;
    const n = originalLoanDuration;

    if (monthlyRate === 0) {
      // No interest scenario
      const payment = loanAmount / n;
      setMinimumPayment(Number(payment.toFixed(2)));
      return;
    }

    // Loan amortization formula
    const payment =
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1);

    setMinimumPayment(Number(payment.toFixed(2)));
  };

  const calculateOriginalLoanTotalInterest = () => {
    const schedule = calculatePaymentSchedule(
      loanAmount,
      interestRate,
      originalLoanDuration,
      minimumPayment,
      minimumPayment,
      true // Flag to indicate original loan schedule
    );
    const totalInterest = schedule.reduce(
      (acc, payment) => acc + payment.interestPaid,
      0
    );
    setOriginalTotalInterest(Number(totalInterest.toFixed(2)));
  };

  const calculateAutoMinPayment = () => {
    const monthlyRate = interestRate / 100 / 12;
    const n = desiredLoanDuration;

    if (monthlyRate === 0) {
      // No interest scenario
      const payment = loanAmount / n;
      setAutoMinPayment(Number(payment.toFixed(2)));
      return;
    }

    // Loan amortization formula
    const payment =
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1);

    setAutoMinPayment(Number(payment.toFixed(2)));
  };

  const calculateAutoMaxPayment = () => {
    const monthlyRate = interestRate / 100 / 12;
    const remainingMonths = desiredLoanDuration - 1;

    if (monthlyRate === 0) {
      // No interest scenario
      const autoMax = loanAmount - actualMinimumPayment * remainingMonths;
      setAutoMaxPayment(Number(autoMax.toFixed(2)));
      return;
    }

    // Present Value of an Annuity formula
    const pvAnnuity =
      actualMinimumPayment *
      ((1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate);

    // Remaining balance after the first payment
    const autoMax = loanAmount * (1 + monthlyRate) - pvAnnuity;

    setAutoMaxPayment(Number(autoMax.toFixed(2)));
  };

  const calculatePayments = () => {
    let schedule = [];
    setErrorMessage(''); // Reset error message
    if (customMaxPayment > 0) {
      const result = calculateCustomMaxPaymentSchedule();
      schedule = result.schedule;
      setAdjustedMedianPayment(result.adjustedMedianPayment);
      setCustomMaxPaymentMonths(result.customMaxPaymentMonths);
      if (schedule.length === 0) {
        setErrorMessage(
          'Unable to create a payment schedule with the provided Custom Max Payment and Desired Loan Duration. Please adjust your inputs.'
        );
      }
    } else {
      schedule = calculateAutoMaxPaymentSchedule();
      setAdjustedMedianPayment(0); // Reset adjustedMedianPayment when not using customMaxPayment
      setCustomMaxPaymentMonths(0); // Reset customMaxPaymentMonths
    }
    setPaymentSchedule(schedule);

    // Calculate total interest for custom payment schedule
    const totalInterest = schedule.reduce(
      (acc, payment) => acc + payment.interestPaid,
      0
    );
    setCustomTotalInterest(Number(totalInterest.toFixed(2)));
  };

  const calculateAutoMaxPaymentSchedule = () => {
    return calculatePaymentSchedule(
      loanAmount,
      interestRate,
      desiredLoanDuration,
      actualMinimumPayment,
      autoMaxPayment
    );
  };

  const calculateCustomMaxPaymentSchedule = () => {
    const monthlyRate = interestRate / 100 / 12;
    const desiredDuration = desiredLoanDuration;
    let maxMonths = desiredDuration - 2; // Reserve at least 1 month for median payment and 1 for minimum payments
    let schedule = [];
    let adjustedMedianPaymentValue = 0;
    let foundValidSchedule = false;

    while (maxMonths > 0) {
      // Calculate remaining balance after maxMonths of custom max payments
      let balance = loanAmount;
      for (let month = 1; month <= maxMonths; month++) {
        const interest = balance * monthlyRate;
        let principal = customMaxPayment - interest;
        if (principal > balance) {
          principal = balance;
          balance = 0;
          break;
        } else {
          balance -= principal;
        }
      }

      // Calculate adjusted median payment
      const remainingMonths = desiredDuration - maxMonths - 1;
      if (remainingMonths < 0) {
        maxMonths--;
        continue;
      }

      // Present Value of remaining minimum payments
      const pvAnnuity =
        actualMinimumPayment *
        ((1 - Math.pow(1 + monthlyRate, -remainingMonths)) / monthlyRate);

      // Adjusted median payment calculation
      adjustedMedianPaymentValue =
        balance * (1 + monthlyRate) - pvAnnuity;

      if (
        adjustedMedianPaymentValue <= customMaxPayment &&
        adjustedMedianPaymentValue > 0
      ) {
        // Generate full payment schedule
        schedule = generatePaymentSchedule(
          loanAmount,
          interestRate,
          desiredDuration,
          actualMinimumPayment,
          customMaxPayment,
          maxMonths,
          adjustedMedianPaymentValue
        );

        // Validate the schedule
        const totalPayments = schedule.length;
        const lastPayment = schedule[schedule.length - 1];

        if (
          totalPayments === desiredDuration &&
          lastPayment.payment >= 0 &&
          lastPayment.payment <= actualMinimumPayment
        ) {
          foundValidSchedule = true;
          break;
        }
      }

      maxMonths--;
    }

    if (!foundValidSchedule) {
      return { schedule: [], adjustedMedianPayment: 0, customMaxPaymentMonths: 0 };
    }

    return {
      schedule,
      adjustedMedianPayment: adjustedMedianPaymentValue,
      customMaxPaymentMonths: maxMonths
    };
  };

  const generatePaymentSchedule = (
    loanAmount,
    interestRate,
    desiredDuration,
    actualMinimumPayment,
    customMaxPayment,
    customMaxMonths,
    adjustedMedianPaymentValue
  ) => {
    const monthlyRate = interestRate / 100 / 12;
    let balance = loanAmount;
    const schedule = [];

    // Payments at customMaxPayment
    for (let month = 1; month <= customMaxMonths; month++) {
      const interest = balance * monthlyRate;
      let payment = customMaxPayment;
      let principal = payment - interest;

      // Adjust payment if it would overpay the balance
      if (principal > balance) {
        principal = balance;
        payment = principal + interest;
        balance = 0;
      } else {
        balance -= principal;
      }

      schedule.push({
        month,
        payment: Number(payment.toFixed(2)),
        interestPaid: Number(interest.toFixed(2)),
        principalPaid: Number(principal.toFixed(2)),
        remainingBalance: Number(balance.toFixed(2))
      });

      if (balance <= 0) {
        // Loan is paid off
        return schedule;
      }
    }

    // Median month with adjusted payment
    if (balance > 0 && customMaxMonths + 1 <= desiredDuration) {
      const month = customMaxMonths + 1;
      const interest = balance * monthlyRate;
      let payment = adjustedMedianPaymentValue;
      let principal = payment - interest;

      // Check for negative payment
      if (payment <= 0) {
        return []; // Invalid schedule
      }

      if (principal > balance) {
        principal = balance;
        payment = principal + interest;
        balance = 0;
      } else {
        balance -= principal;
      }

      schedule.push({
        month,
        payment: Number(payment.toFixed(2)),
        interestPaid: Number(interest.toFixed(2)),
        principalPaid: Number(principal.toFixed(2)),
        remainingBalance: Number(balance.toFixed(2))
      });
    }

    // Payments at actualMinimumPayment
    for (
      let month = customMaxMonths + 2;
      month <= desiredDuration;
      month++
    ) {
      const interest = balance * monthlyRate;
      let payment = actualMinimumPayment;
      let principal = payment - interest;

      // Adjust final payment if necessary
      if (month === desiredDuration) {
        principal = balance;
        payment = principal + interest;
        balance = 0;
      } else if (principal > balance) {
        principal = balance;
        payment = principal + interest;
        balance = 0;
      } else {
        balance -= principal;
      }

      schedule.push({
        month,
        payment: Number(payment.toFixed(2)),
        interestPaid: Number(interest.toFixed(2)),
        principalPaid: Number(principal.toFixed(2)),
        remainingBalance: Number(balance.toFixed(2))
      });

      if (balance <= 0) {
        // Loan is paid off
        return schedule;
      }
    }

    return schedule;
  };

  const calculatePaymentSchedule = (
    loanAmount,
    interestRate,
    duration,
    paymentAmount,
    initialPayment,
    isOriginalLoan = false
  ) => {
    const monthlyRate = interestRate / 100 / 12;
    let balance = loanAmount;
    const schedule = [];

    // First payment
    let interest = balance * monthlyRate;
    let payment = initialPayment;
    let principal = payment - interest;
    balance -= principal;

    schedule.push({
      month: 1,
      payment: Number(payment.toFixed(2)),
      interestPaid: Number(interest.toFixed(2)),
      principalPaid: Number(principal.toFixed(2)),
      remainingBalance: Number(balance.toFixed(2))
    });

    // Payments at paymentAmount
    for (let month = 2; month <= duration; month++) {
      interest = balance * monthlyRate;
      payment = paymentAmount;
      principal = payment - interest;

      // Adjust final payment if necessary
      if (month === duration) {
        principal = balance;
        payment = principal + interest;
        balance = 0;
      } else if (principal > balance) {
        principal = balance;
        payment = principal + interest;
        balance = 0;
      } else {
        balance -= principal;
      }

      schedule.push({
        month,
        payment: Number(payment.toFixed(2)),
        interestPaid: Number(interest.toFixed(2)),
        principalPaid: Number(principal.toFixed(2)),
        remainingBalance: Number(balance.toFixed(2))
      });

      if (balance <= 0) {
        // Loan is paid off
        return schedule;
      }
    }

    // If original loan and balance remains, continue payments
    if (isOriginalLoan && balance > 0) {
      let month = duration + 1;
      while (balance > 0) {
        interest = balance * monthlyRate;
        payment = paymentAmount;
        principal = payment - interest;

        if (principal > balance) {
          principal = balance;
          payment = principal + interest;
          balance = 0;
        } else {
          balance -= principal;
        }

        schedule.push({
          month,
          payment: Number(payment.toFixed(2)),
          interestPaid: Number(interest.toFixed(2)),
          principalPaid: Number(principal.toFixed(2)),
          remainingBalance: Number(balance.toFixed(2))
        });
        month++;
      }
    }

    return schedule;
  };

  const handleInputChange = (setter) => (e) => {
    const value = Number(e.target.value);
    setter(value);
  };

  const handleCustomMaxPaymentInputChange = (e) => {
    setCustomMaxPaymentInput(e.target.value);
  };

  const applyCustomMaxPayment = () => {
    const value = Number(customMaxPaymentInput);
    setCustomMaxPayment(isNaN(value) ? 0 : value);
  };

  const handleActualMinimumPaymentInputChange = (e) => {
    setActualMinimumPaymentInput(e.target.value);
  };

  const applyActualMinimumPayment = () => {
    const value = Number(actualMinimumPaymentInput);
    setActualMinimumPayment(isNaN(value) ? 0 : value);
  };

  // Data for Comparison Chart
  const comparisonData = [
    {
      name: 'Original Loan',
      'Total Interest': originalTotalInterest,
      'Total Payments': loanAmount + originalTotalInterest
    },
    {
      name: 'Custom Plan',
      'Total Interest': customTotalInterest,
      'Total Payments': loanAmount + customTotalInterest
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Loan Payment Optimizer</h1>
        <p style={styles.description}>
          Minimize your interest payments by optimizing your loan repayment
          strategy. This calculator helps you find the best payment plan to
          reduce your total interest while maintaining manageable monthly
          payments.
        </p>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="loanAmount">
              Loan Amount ($)
            </label>
            <input
              style={styles.input}
              id="loanAmount"
              type="number"
              value={loanAmount}
              onChange={handleInputChange(setLoanAmount)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="interestRate">
              Interest Rate (%)
            </label>
            <input
              style={styles.input}
              id="interestRate"
              type="number"
              value={interestRate}
              onChange={handleInputChange(setInterestRate)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="originalLoanDuration">
              Original Loan Duration (months)
            </label>
            <input
              style={styles.input}
              id="originalLoanDuration"
              type="number"
              value={originalLoanDuration}
              onChange={handleInputChange(setOriginalLoanDuration)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="desiredLoanDuration">
              Desired Loan Duration (months)
            </label>
            <input
              style={styles.input}
              id="desiredLoanDuration"
              type="number"
              value={desiredLoanDuration}
              onChange={handleInputChange(setDesiredLoanDuration)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="minimumPayment">
              Calculated Minimum Payment ($)
            </label>
            <input
              style={{ ...styles.input, ...styles.readOnlyInput }}
              id="minimumPayment"
              type="number"
              value={minimumPayment}
              readOnly
            />
            <p style={styles.smallText}>
              This is the minimum payment based on your original loan duration.
            </p>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="actualMinimumPaymentInput">
              Actual Minimum Payment ($)
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                style={{ ...styles.input, marginRight: '8px' }}
                id="actualMinimumPaymentInput"
                type="number"
                value={actualMinimumPaymentInput}
                onChange={handleActualMinimumPaymentInputChange}
              />
              <button onClick={applyActualMinimumPayment}>Apply</button>
            </div>
            <p style={styles.smallText}>
              Enter your actual minimum payment. Click "Apply" to update.
            </p>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="autoMinPayment">
              AutoMin Payment ($)
            </label>
            <input
              style={{ ...styles.input, ...styles.readOnlyInput }}
              id="autoMinPayment"
              type="number"
              value={autoMinPayment}
              readOnly
            />
            <p style={styles.smallText}>
              This is the minimum payment required to pay off the loan in your desired loan duration.
            </p>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="autoMaxPayment">
              AutoMax Payment ($)
            </label>
            <input
              style={{ ...styles.input, ...styles.readOnlyInput }}
              id="autoMaxPayment"
              type="number"
              value={autoMaxPayment}
              readOnly
            />
            <p style={styles.smallText}>
              This is the maximum initial payment to minimize interest while
              keeping remaining payments at your actual minimum amount.
            </p>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="customMaxPaymentInput">
              Custom Max Payment ($) (Optional)
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                style={{ ...styles.input, marginRight: '8px' }}
                id="customMaxPaymentInput"
                type="number"
                value={customMaxPaymentInput}
                onChange={handleCustomMaxPaymentInputChange}
              />
              <button onClick={applyCustomMaxPayment}>Apply</button>
            </div>
            <p style={styles.smallText}>
              Enter a custom maximum payment if you can afford more than the
              suggested amount. Click "Apply" to calculate.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={styles.card}>
          <p style={{ color: 'red' }}>{errorMessage}</p>
        </div>
      )}

      {paymentSchedule.length > 0 && (
        <>
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Payment Schedule</h2>
            {customMaxPayment > 0 && customMaxPaymentMonths > 0 ? (
              <p style={styles.description}>
                Pay <strong>${customMaxPayment.toFixed(2)}</strong> for{' '}
                <strong>{customMaxPaymentMonths}</strong> months, then pay{' '}
                <strong>${adjustedMedianPayment.toFixed(2)}</strong> in month{' '}
                <strong>{customMaxPaymentMonths + 1}</strong>, and then make the
                minimum payments of{' '}
                <strong>${actualMinimumPayment.toFixed(2)}</strong> to pay off
                your loan in{' '}
                <strong>{desiredLoanDuration}</strong> months.
              </p>
            ) : (
              <p style={styles.description}>
                Pay <strong>${autoMaxPayment.toFixed(2)}</strong> in the first
                month, then make the minimum payment of{' '}
                <strong>${actualMinimumPayment.toFixed(2)}</strong> to pay off
                your loan in{' '}
                <strong>{desiredLoanDuration}</strong> months.
              </p>
            )}
            <div style={{ height: '400px', marginBottom: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paymentSchedule}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="payment"
                    stroke="#3b82f6"
                    name="Payment"
                  />
                  <Line
                    type="monotone"
                    dataKey="interestPaid"
                    stroke="#f97316"
                    name="Interest Paid"
                  />
                  <Line
                    type="monotone"
                    dataKey="remainingBalance"
                    stroke="#10b981"
                    name="Remaining Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Month</th>
                    <th style={styles.th}>Payment</th>
                    <th style={styles.th}>Interest Paid</th>
                    <th style={styles.th}>Principal Paid</th>
                    <th style={styles.th}>Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSchedule.map((payment, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{payment.month}</td>
                      <td style={styles.td}>${payment.payment.toFixed(2)}</td>
                      <td style={styles.td}>
                        ${payment.interestPaid.toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        ${payment.principalPaid.toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        ${payment.remainingBalance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison Card */}
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Total Cost Comparison</h2>
            <div style={{ height: '300px', marginBottom: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Total Interest" fill="#8884d8" />
                  <Bar dataKey="Total Payments" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={styles.description}>
              This chart compares the total interest paid and total payments
              between the original loan and your custom payment plan.
            </p>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}></th>
                  <th style={styles.th}>Original Loan</th>
                  <th style={styles.th}>Custom Plan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.td}>Total Interest Paid</td>
                  <td style={styles.td}>${originalTotalInterest.toFixed(2)}</td>
                  <td style={styles.td}>${customTotalInterest.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={styles.td}>Total Payments</td>
                  <td style={styles.td}>
                    ${(loanAmount + originalTotalInterest).toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    ${(loanAmount + customTotalInterest).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LoanPaymentCalculator;
