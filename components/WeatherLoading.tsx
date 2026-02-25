export default function WeatherLoading() {
    return (
        <div className="aqi-widget" style={{ marginBottom: "1.5rem" }}>
            <div className="skeleton" style={{ height: "1.2rem", width: "60%", marginBottom: "1rem" }}></div>
            <div className="aqi-row">
                <div className="skeleton" style={{ height: "1rem", width: "30%" }}></div>
                <div className="skeleton" style={{ height: "1rem", width: "20%" }}></div>
            </div>
            <div className="aqi-row">
                <div className="skeleton" style={{ height: "1rem", width: "30%" }}></div>
                <div className="skeleton" style={{ height: "1rem", width: "20%" }}></div>
            </div>
            <div className="aqi-row">
                <div className="skeleton" style={{ height: "1rem", width: "30%" }}></div>
                <div className="skeleton" style={{ height: "1rem", width: "20%" }}></div>
            </div>
        </div>
    );
}
