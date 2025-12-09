import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ReferenceLine, Area, ComposedChart } from 'recharts';
import './StudentScoreAnalyzer.css';

const StudentScoreAnalyzer = () => {
  const [scores, setScores] = useState([]);
  const [numStudents, setNumStudents] = useState(30);
  const [meanScore, setMeanScore] = useState(75);
  const [stdDev, setStdDev] = useState(12);
  const [cutoffScore, setCutoffScore] = useState(75);

  // Generate random scores with normal distribution
  const generateScores = useCallback(() => {
    const newScores = [];
    for (let i = 0; i < numStudents; i++) {
      // Box-Muller transformation for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      let score = meanScore + stdDev * z0;
      
      // Clamp scores between 0 and 100
      score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
      newScores.push(score);
    }
    setScores(newScores.sort((a, b) => a - b));
  }, [numStudents, meanScore, stdDev]);

  // Calculate descriptive statistics
  const stats = useMemo(() => {
    if (scores.length === 0) return {};
    
    // Get mode of scores
    const getMode = (arr) => {
      const frequency = {};
      let maxFreq = 0;
      let modes = [];
      
      arr.forEach(score => {
        const rounded = Math.round(score);
        frequency[rounded] = (frequency[rounded] || 0) + 1;
        if (frequency[rounded] > maxFreq) {
          maxFreq = frequency[rounded];
          modes = [rounded];
        } else if (frequency[rounded] === maxFreq && !modes.includes(rounded)) {
          modes.push(rounded);
        }
      });
      
      return modes.length === Object.keys(frequency).length ? 'No mode' : modes.join(', ');
    };
    
    const sorted = [...scores].sort((a, b) => a - b);
    const n = scores.length;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const mean = sum / n;
    
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / (n - 1);
    const standardDev = Math.sqrt(variance);
    
    const q1Index = Math.floor(n * 0.25);
    const medianIndex = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    
    return {
      count: n,
      mean: mean.toFixed(2),
      median: n % 2 === 0 ? ((sorted[medianIndex - 1] + sorted[medianIndex]) / 2).toFixed(2) : sorted[medianIndex].toFixed(2),
      mode: getMode(scores),
      min: Math.min(...scores).toFixed(1),
      max: Math.max(...scores).toFixed(1),
      range: (Math.max(...scores) - Math.min(...scores)).toFixed(1),
      q1: sorted[q1Index].toFixed(1),
      q3: sorted[q3Index].toFixed(1),
      iqr: (sorted[q3Index] - sorted[q1Index]).toFixed(1),
      standardDev: standardDev.toFixed(2),
      variance: variance.toFixed(2)
    };
  }, [scores]);

  // Create histogram data
  const histogramData = useMemo(() => {
    if (scores.length === 0) return [];
    
    const bins = [];
    const binSize = 5;
    const minScore = Math.floor(Math.min(...scores) / binSize) * binSize;
    const maxScore = Math.ceil(Math.max(...scores) / binSize) * binSize;
    
    for (let i = minScore; i <= maxScore; i += binSize) {
      bins.push({
        range: `${i}-${i + binSize - 1}`,
        count: scores.filter(score => score >= i && score < i + binSize).length,
        midpoint: i + binSize / 2
      });
    }
    
    return bins;
  }, [scores]);

  // Create normal distribution curve data
  const normalCurveData = useMemo(() => {
    if (!stats.mean) return [];
    
    const data = [];
    const mean = parseFloat(stats.mean);
    const sd = parseFloat(stats.standardDev);
    
    for (let x = mean - 4 * sd; x <= mean + 4 * sd; x += 0.5) {
      const y = (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
      data.push({
        x: x.toFixed(1),
        y: y * scores.length * 5, // Scale to match histogram
        belowCutoff: x <= cutoffScore
      });
    }
    
    return data;
  }, [stats.mean, stats.standardDev, scores.length, cutoffScore]);

  // Calculate percentages above and below cutoff
  const cutoffStats = useMemo(() => {
    if (scores.length === 0) return { below: 0, above: 0, at: 0 };
    
    const below = scores.filter(score => score < cutoffScore).length;
    const above = scores.filter(score => score > cutoffScore).length;
    const at = scores.filter(score => score === cutoffScore).length;
    
    return {
      below: ((below / scores.length) * 100).toFixed(1),
      above: ((above / scores.length) * 100).toFixed(1),
      at: ((at / scores.length) * 100).toFixed(1)
    };
  }, [scores, cutoffScore]);

  // Generate initial data
  useEffect(() => {
    generateScores();
  }, [generateScores]);

  return (
    <div className="app-container">
      <div className="main-content">
        <h1 className="main-title">
          Student Test Score Analyzer
        </h1>
        
        {/* Data Generation Controls */}
        <div className="card">
          <h2 className="section-title">Generate Test Data</h2>
          <div className="controls-grid">
            <div className="control-group">
              <label className="control-label">
                Number of Students
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={numStudents}
                onChange={(e) => setNumStudents(parseInt(e.target.value))}
                className="control-input"
              />
            </div>
            <div className="control-group">
              <label className="control-label">
                Target Mean Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={meanScore}
                onChange={(e) => setMeanScore(parseInt(e.target.value))}
                className="control-input"
              />
            </div>
            <div className="control-group">
              <label className="control-label">
                Standard Deviation
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={stdDev}
                onChange={(e) => setStdDev(parseInt(e.target.value))}
                className="control-input"
              />
            </div>
          </div>
          <button
            onClick={generateScores}
            className="generate-btn"
          >
            Generate New Data
          </button>
        </div>

        <div className="content-grid">
          {/* Descriptive Statistics */}
          <div className="card stats-card">
            <h2 className="section-title">Descriptive Statistics</h2>
            <div className="stats-list">
              <div className="stat-row">
                <span className="stat-label">Count:</span>
                <span className="stat-value">{stats.count}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Mean:</span>
                <span className="stat-value">{stats.mean}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Median:</span>
                <span className="stat-value">{stats.median}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Mode:</span>
                <span className="stat-value">{stats.mode}</span>
              </div>
              <hr className="stat-divider" />
              <div className="stat-row">
                <span className="stat-label">Minimum:</span>
                <span className="stat-value">{stats.min}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Maximum:</span>
                <span className="stat-value">{stats.max}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Range:</span>
                <span className="stat-value">{stats.range}</span>
              </div>
              <hr className="stat-divider" />
              <div className="stat-row">
                <span className="stat-label">Q1 (25th percentile):</span>
                <span className="stat-value">{stats.q1}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Q3 (75th percentile):</span>
                <span className="stat-value">{stats.q3}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">IQR:</span>
                <span className="stat-value">{stats.iqr}</span>
              </div>
              <hr className="stat-divider" />
              <div className="stat-row">
                <span className="stat-label">Standard Deviation:</span>
                <span className="stat-value">{stats.standardDev}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Variance:</span>
                <span className="stat-value">{stats.variance}</span>
              </div>
            </div>
          </div>

          {/* Distribution Visualization */}
          <div className="card chart-card">
            <h2 className="section-title">Score Distribution</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" fillOpacity={0.7} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <h3 className="subsection-title">Normal Distribution Curve</h3>
            <div className="chart-container-small">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={normalCurveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    dataKey="y" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <ReferenceLine x={cutoffScore} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Interactive Cutoff Analysis */}
        <div className="card">
          <h2 className="section-title">Grade Cutoff Analysis</h2>
          <div className="slider-container">
            <label className="control-label">
              Cutoff Score: {cutoffScore}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={cutoffScore}
              onChange={(e) => setCutoffScore(parseFloat(e.target.value))}
              className="cutoff-slider"
            />
            <div className="slider-labels">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
          
          <div className="cutoff-stats-grid">
            <div className="cutoff-stat below">
              <div className="cutoff-percentage">{cutoffStats.below}%</div>
              <div className="cutoff-label">Below {cutoffScore}</div>
              <div className="cutoff-count">
                {scores.filter(s => s < cutoffScore).length} students
              </div>
            </div>
            
            <div className="cutoff-stat at">
              <div className="cutoff-percentage">{cutoffStats.at}%</div>
              <div className="cutoff-label">At {cutoffScore}</div>
              <div className="cutoff-count">
                {scores.filter(s => s === cutoffScore).length} students
              </div>
            </div>
            
            <div className="cutoff-stat above">
              <div className="cutoff-percentage">{cutoffStats.above}%</div>
              <div className="cutoff-label">Above {cutoffScore}</div>
              <div className="cutoff-count">
                {scores.filter(s => s > cutoffScore).length} students
              </div>
            </div>
          </div>
        </div>

        {/* Raw Scores Display */}
        <div className="card">
          <h2 className="section-title">All Scores</h2>
          <div className="scores-container">
            <div className="scores-grid">
              {scores.map((score, index) => (
                <span
                  key={index}
                  className={`score-badge ${
                    score < cutoffScore 
                      ? 'score-below'
                      : score === cutoffScore
                      ? 'score-at'
                      : 'score-above'
                  }`}
                >
                  {score}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentScoreAnalyzer;
