import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      marginBottom: '20px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
    },
    subtitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '12px',
    },
    description: {
      marginBottom: '16px',
      lineHeight: '1.5',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    },
    inputGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
    readOnlyInput: {
      backgroundColor: '#f0f0f0',
    },
    smallText: {
      fontSize: '14px',
      color: '#666',
      marginTop: '4px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      backgroundColor: '#f0f0f0',
      textAlign: 'left',
      padding: '12px',
      borderBottom: '2px solid #ddd',
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #ddd',
    },
  };
  const LoanPaymentCalculator = () => {
    const [loanAmount, setLoanAmount] = useState();
    const [interestRate, setInterestRate] = useState();
    const [minimumPayment, setMinimumPayment] = useState();
    const [loanDuration, setLoanDuration] = useState();
    const [autoMaxPayment, setAutoMaxPayment] = useState(0);
    const [customMaxPayment, setCustomMaxPayment] = useState(0);
    const [paymentSchedule, setPaymentSchedule] = useState([]);
  
    useEffect(() => {
      calculateAutoMaxPayment();
    }, [loanAmount, interestRate, loanDuration, minimumPayment]);
  
    useEffect(() => {
      calculatePayments();
    }, [loanAmount, interestRate, minimumPayment, loanDuration, autoMaxPayment, customMaxPayment]);
  
  const calculateAutoMaxPayment = () => {
    const monthlyRate = interestRate / 100 / 12;
    const remainingMonths = loanDuration - 1;
    const balanceAfterInitialMax = loanAmount * (1 + monthlyRate) - minimumPayment * remainingMonths;
    const autoMax = Math.max(minimumPayment, balanceAfterInitialMax);
    setAutoMaxPayment(Number(autoMax.toFixed(2)));
  };

  const calculatePayments = () => {
    const maxPayment = customMaxPayment > 0 ? customMaxPayment : autoMaxPayment;
    const schedule = calculatePaymentScheduleWithAdjustedFinalMax(
      loanAmount,
      interestRate,
      loanDuration,
      minimumPayment,
      maxPayment
    );
    setPaymentSchedule(schedule);
  };


  const calculateSchedule = (loanAmount, interestRate, loanDuration, minimumPayment, customMaxPayment, monthsMaxPayment) => {
    let balance = loanAmount;
    const monthlyRate = interestRate / 100 / 12;
    let schedule = [];

    for (let month = 1; month <= loanDuration; month++) {
      if (balance <= 0) break;
      const interest = balance * monthlyRate;

      let payment;
      if (month < monthsMaxPayment) {
        payment = customMaxPayment;
      } else if (month === monthsMaxPayment) {
        payment = balance + interest; // This will be adjusted later
      } else {
        payment = Math.min(minimumPayment, balance + interest);
      }

      const principal = payment - interest;
      balance = Math.max(0, balance - principal);

      schedule.push({
        month,
        payment: Number(payment.toFixed(2)),
        interestPaid: Number(interest.toFixed(2)),
        principalPaid: Number(principal.toFixed(2)),
        remainingBalance: Number(balance.toFixed(2))
      });
    }

    return schedule;
  };

  const adjustTransitionMonth = (loanAmount, interestRate, loanDuration, minimumPayment, customMaxPayment, monthsMaxPayment) => {
    let low = minimumPayment;
    let high = customMaxPayment;
    let bestSchedule = null;
    let bestFinalBalance = Infinity;
    const maxIterations = 20;

    for (let i = 0; i < maxIterations; i++) {
      const transitionPayment = (low + high) / 2;
      const schedule = calculateSchedule(loanAmount, interestRate, loanDuration, minimumPayment, customMaxPayment, monthsMaxPayment);
      schedule[monthsMaxPayment - 1].payment = transitionPayment;
      
      let balance = schedule[monthsMaxPayment - 1].remainingBalance;
      for (let month = monthsMaxPayment; month < loanDuration; month++) {
        const interest = balance * (interestRate / 100 / 12);
        const payment = Math.min(minimumPayment, balance + interest);
        const principal = payment - interest;
        balance = Math.max(0, balance - principal);
        
        schedule[month] = {
          month: month + 1,
          payment: Number(payment.toFixed(2)),
          interestPaid: Number(interest.toFixed(2)),
          principalPaid: Number(principal.toFixed(2)),
          remainingBalance: Number(balance.toFixed(2))
        };
      }

      const finalBalance = balance;

      if (Math.abs(finalBalance) < Math.abs(bestFinalBalance)) {
        bestSchedule = schedule;
        bestFinalBalance = finalBalance;
      }

      if (Math.abs(finalBalance) < 10) {
        break;
      } else if (finalBalance > 0) {
        low = transitionPayment;
      } else {
        high = transitionPayment;
      }
    }

    return bestSchedule;
  };
  const calculatePaymentScheduleWithAdjustedFinalMax = (
    loanAmount,
    interestRate,
    loanDuration,
    minimumPayment,
    customMaxPayment,
    suggestedMaxPayment
  ) => {
    const monthlyRate = interestRate / 100 / 12;
    const maxPayment = customMaxPayment > 0 ? customMaxPayment : suggestedMaxPayment;
  
    const calculateSchedule = (initialPayment) => {
      let balance = loanAmount;
      let schedule = [];
  
      for (let month = 1; month <= loanDuration; month++) {
        const interest = balance * monthlyRate;
        let payment;
  
        if (month === 1) {
          payment = initialPayment;
        } else if (month === loanDuration) {
          payment = balance + interest; // Ensure the loan is fully paid off
        } else {
          payment = Math.max(minimumPayment, Math.min(balance + interest, initialPayment));
        }
  
        const principal = payment - interest;
        balance = Math.max(0, balance - principal);
  
        schedule.push({
          month,
          payment: Number(payment.toFixed(2)),
          interestPaid: Number(interest.toFixed(2)),
          principalPaid: Number(principal.toFixed(2)),
          remainingBalance: Number(balance.toFixed(2))
        });
  
        if (balance === 0 && month === loanDuration) break;
      }
  
      return schedule;
    };
  
    // Binary search to find optimal initial payment
    let low = minimumPayment;
    let high = maxPayment;
    let bestSchedule = null;
  
    while (high - low > 0.01) {
      const mid = (low + high) / 2;
      const schedule = calculateSchedule(mid);
      const finalPayment = schedule[schedule.length - 1].payment;
  
      if (finalPayment > minimumPayment) {
        low = mid;
      } else if (finalPayment < minimumPayment) {
        if (!bestSchedule || Math.abs(minimumPayment - finalPayment) < Math.abs(minimumPayment - bestSchedule[bestSchedule.length - 1].payment)) {
          bestSchedule = schedule;
        }
        high = mid;
      } else {
        return schedule; // Perfect match found
      }
    }
  
    return bestSchedule || calculateSchedule(minimumPayment);
  };
  
  const handleInputChange = (setter) => (e) => {
    setter(Number(e.target.value));
  };


  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Loan Payment Optimizer</h1>
        <p style={styles.description}>
          Minimize your interest payments by optimizing your loan repayment strategy. 
          This calculator helps you find the best payment plan to reduce your total interest 
          while maintaining manageable monthly payments.
        </p>
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="loanAmount">Loan Amount ($)</label>
            <input
              style={styles.input}
              id="loanAmount"
              type="number"
              value={loanAmount}
              onChange={handleInputChange(setLoanAmount)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="interestRate">Interest Rate (%)</label>
            <input
              style={styles.input}
              id="interestRate"
              type="number"
              value={interestRate}
              onChange={handleInputChange(setInterestRate)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="minimumPayment">Minimum Payment ($)</label>
            <input
              style={styles.input}
              id="minimumPayment"
              type="number"
              value={minimumPayment}
              onChange={handleInputChange(setMinimumPayment)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="loanDuration">Loan Duration (months)</label>
            <input
              style={styles.input}
              id="loanDuration"
              type="number"
              value={loanDuration}
              onChange={handleInputChange(setLoanDuration)}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="autoMaxPayment">Suggested Max Payment ($)</label>
            <input
              style={{...styles.input, ...styles.readOnlyInput}}
              id="autoMaxPayment"
              type="number"
              value={autoMaxPayment}
              readOnly
            />
            <p style={styles.smallText}>
              This is the optimal first payment to minimize interest while maintaining your desired loan duration.
            </p>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="customMaxPayment">Custom Max Payment ($) (Optional)</label>
            <input
              style={styles.input}
              id="customMaxPayment"
              type="number"
              value={customMaxPayment}
              onChange={handleInputChange(setCustomMaxPayment)}
            />
            <p style={styles.smallText}>
              Enter a custom maximum payment if you can afford more than the suggested amount.
            </p>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Payment Schedule</h2>
        <p style={styles.description}>
          This chart and table show your projected payment schedule. The blue line represents 
          your monthly payments, while the green line shows your remaining balance over time.
        </p>
        <div style={{ height: '400px', marginBottom: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paymentSchedule}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="payment" stroke="#3b82f6" name="Payment" />
              <Line type="monotone" dataKey="remainingBalance" stroke="#10b981" name="Remaining Balance" />
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
                  <td style={styles.td}>${payment.interestPaid.toFixed(2)}</td>
                  <td style={styles.td}>${payment.principalPaid.toFixed(2)}</td>
                  <td style={styles.td}>${payment.remainingBalance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanPaymentCalculator;