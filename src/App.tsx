import "./App.css";
import { InputNumber } from "primereact/inputnumber";
import { InputNumberValueChangeEvent } from "primereact/inputnumber";
import { FloatLabel } from "primereact/floatlabel";
import { Panel } from "primereact/panel";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  responsive: true,
  animation: {
    duration: 0,
  },

  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Martingale Mythbuster",
    },
  },
};

const getSecureRandomNumber = () => {
  // Create a typed array to hold the random values
  const array = new Uint32Array(1); // 32-bit unsigned integer array

  // Fill the array with cryptographically secure random values
  crypto.getRandomValues(array);

  // Convert the random value to a floating-point number between 0 and 1
  return array[0] / 4294967295; // Divide by the maximum 32-bit unsigned integer value
};

const runSimulation = (
  opts: {
    starting_balance: number;
    initial_bet_size: number;
  } & ({ bet_count: number } | { run_till_broke: true }),
): number[] => {
  let balances = [opts.starting_balance];
  const winning_odds = 18 / 37;

  let bet_size = opts.initial_bet_size;
  let bet_count = "bet_count" in opts ? opts.bet_count : BET_COUNT_LIMIT; // Handle both cases

  let i = 0;
  while (i < bet_count) {
    const current_balance = balances[balances.length - 1];

    // Stop if the bet size exceeds the current balance
    if (bet_size > current_balance) {
      break;
    }

    // Simulate the bet outcome
    const isWin = getSecureRandomNumber() < winning_odds;

    // Update the balance and bet size
    if (isWin) {
      balances.push(current_balance + bet_size);
      bet_size = opts.initial_bet_size; // Reset bet size after a win
    } else {
      balances.push(current_balance - bet_size);
      bet_size *= 2; // Double the bet size after a loss
    }

    i++;
  }

  return balances;
};

const BET_COUNT_LIMIT = 100_000;
export const App = () => {
  const [disclaimerModalOpen, setDisclaimerModalOpen] = useState(true);

  const [data, setData] = useState([] as any[]);

  const [initialBetSize, setInitialBetsize] = useState(1.0);
  const [startingBalance, setStartingBalance] = useState(10_000);

  const onParameterChange = () => {
    setData(
      runSimulation({
        initial_bet_size: initialBetSize,
        starting_balance: startingBalance,
        run_till_broke: true,
      }),
    );
  };

  useEffect(() => {
    onParameterChange();
  }, [initialBetSize, startingBalance]);

  const chart_data = {
    labels: data.map((_, index) => index),
    datasets: [
      {
        label: "Account Balance",
        data: data,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  return (
    <main>
      <Dialog
        header="⚠️ Important Disclaimer ⚠️"
        visible={disclaimerModalOpen}
        style={{ width: "50vw" }}
        onHide={() => {
          if (!disclaimerModalOpen) return;
          setDisclaimerModalOpen(false);
        }}
      >
        <p>
          <strong>
            This application is a simulation designed to demonstrate the risks
            of gambling and the flaws of the Martingale strategy.
          </strong>
        </p>
        <p>
          Gambling is inherently risky, and no strategy, including Martingale,
          can guarantee success. The purpose of this app is to show that
          gambling{" "}
          <strong>always leads to financial loss in the long run</strong>, and
          the Martingale strategy does not change this fact. It only delays the
          inevitable: going broke.
        </p>
        <p>
          <strong>This app is for educational purposes only.</strong> It is not
          intended to encourage or promote gambling. Gambling can lead to severe
          financial and emotional consequences. If you or someone you know
          struggles with gambling, please seek help from a professional
          organization.
        </p>
      </Dialog>

      <div className="inputs">
        <Panel
          header="Parameters"
          style={{
            margin: "50px",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px",
              gap: "10px",
            }}
          >
            <FloatLabel>
              <InputNumber
                id="initialBetSize"
                value={initialBetSize}
                onValueChange={(e: InputNumberValueChangeEvent) =>
                  setInitialBetsize(e.value || 0.01)
                }
                min={0.01}
                mode="currency"
                currency="USD"
              />
              <label htmlFor="initialBetSize">Initial Bet Size</label>
            </FloatLabel>
            <FloatLabel>
              <InputNumber
                id="startingBalance"
                value={startingBalance}
                onValueChange={(e: InputNumberValueChangeEvent) =>
                  setStartingBalance(e.value || 0.01)
                }
                min={0.01}
                mode="currency"
                currency="USD"
              />
              <label htmlFor="startingBalance">Starting Balance</label>
            </FloatLabel>
            <Button onClick={onParameterChange}>Rerun</Button>
          </div>
        </Panel>

        <Panel
          header="Results"
          style={{
            margin: "50px",
          }}
        >
          {data.length < BET_COUNT_LIMIT ? (
            <p
              style={{
                color: "red",
              }}
            >
              You would have lost all your money after {data.length - 1} bets.
            </p>
          ) : (
            <p
              style={{
                color: "green",
              }}
            >
              You were lucky and not went broke after {BET_COUNT_LIMIT} bets.
            </p>
          )}
        </Panel>
      </div>
      <Line options={options} data={chart_data} />
    </main>
  );
};
