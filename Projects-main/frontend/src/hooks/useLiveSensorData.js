import { useEffect, useState } from "react";

function useLiveSensorData() {
  const [sensorData, setSensorData] = useState([]);  // MUST be []

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/data/latest");
        const data = await res.json();
        setSensorData(data || []);   // ensure array
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  return { sensorData };
}

export default useLiveSensorData;
