import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FunctionType, FunctionParams, Point } from '../types';

interface GraphPlotProps {
  funcType: FunctionType;
  params: FunctionParams;
  points: Point[];
  containerRef?: React.RefObject<HTMLDivElement>;
  onMount?: (svg: SVGSVGElement) => void;
}

const GraphPlot: React.FC<GraphPlotProps> = ({ funcType, params, points, onMount }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawing

    if (onMount && svgRef.current) {
      onMount(svgRef.current);
    }

    const width = 600;
    const height = 600;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    // Determine Domain/Range ensuring aspect ratio 1:1
    const xMaxInput = Math.max(...points.map(p => Math.abs(p.x)));
    const yMaxInput = Math.max(...points.map(p => Math.abs(p.y)));
    
    // Add some padding
    const maxVal = Math.max(xMaxInput, yMaxInput) + 2;
    const domain = [-maxVal, maxVal];

    // Scales
    const xScale = d3.scaleLinear().domain(domain).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain(domain).range([height - margin.bottom, margin.top]); // Y flips

    // Define Arrow Marker
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10) // Tip of arrow
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "black");

    // Draw Grid (Optional, faint)
    const xTicks = xScale.ticks(10);
    const yTicks = yScale.ticks(10);

    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(xTicks)
      .join("line")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom);

    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(yTicks)
      .join("line")
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("x1", margin.left)
      .attr("x2", width - margin.right);

    // Draw Axes
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${yScale(0)})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(10)
          .tickSize(5)
          .tickPadding(5)
          .tickFormat((d) => d === 0 ? "" : String(d)) // Hide 0 on X axis
      )
      .attr("font-size", "12px");
    
    // Remove default domain line and draw a custom one with arrow
    xAxis.select(".domain").remove();
    svg.append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Label x
    svg.append("text")
      .attr("x", width - margin.right)
      .attr("y", yScale(0) - 10)
      .attr("text-anchor", "end")
      .attr("font-weight", "bold")
      .text("x");

    const yAxis = svg.append("g")
      .attr("transform", `translate(${xScale(0)},0)`)
      .call(
        d3.axisLeft(yScale)
          .ticks(10)
          .tickSize(5)
          .tickPadding(5)
          .tickFormat((d) => d === 0 ? "" : String(d)) // Hide 0 on Y axis
      )
      .attr("font-size", "12px");

    yAxis.select(".domain").remove();
    svg.append("line")
      .attr("y1", height - margin.bottom)
      .attr("y2", margin.top)
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Label y
    svg.append("text")
      .attr("x", xScale(0) + 15)
      .attr("y", margin.top)
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("y");

    // Single Origin Label '0'
    svg.append("text")
      .attr("x", xScale(0) - 12)
      .attr("y", yScale(0) + 15)
      .attr("font-size", "12px")
      .text("0");

    // Draw Function
    const lineGenerator = d3.line<number>()
      .x(d => xScale(d))
      .y(d => {
        const x = d;
        let y = 0;
        if (funcType === FunctionType.LinearOrigin) y = params.a * x;
        else if (funcType === FunctionType.LinearAffine) y = params.a * x + params.b;
        else if (funcType === FunctionType.Quadratic) y = params.a * x * x;
        return yScale(y);
      })
      .curve(d3.curveMonotoneX); // Smooth curve for parabola

    // Generate dense points for smoothness
    const densePoints = d3.range(domain[0], domain[1], 0.1);
    
    svg.append("path")
      .datum(densePoints)
      .attr("fill", "none")
      .attr("stroke", "#B22222") // Red function line
      .attr("stroke-width", 2.5)
      .attr("d", lineGenerator);

    // Draw Projections (Dashed lines) & Points
    points.forEach(p => {
      // Don't draw projection for origin if it's (0,0) as it overlaps axis
      if (p.x !== 0 && p.y !== 0) {
        // Vertical dashed
        svg.append("line")
          .attr("x1", xScale(p.x))
          .attr("y1", yScale(0))
          .attr("x2", xScale(p.x))
          .attr("y2", yScale(p.y))
          .attr("stroke", "#666")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 4");

        // Horizontal dashed
        svg.append("line")
          .attr("x1", xScale(0))
          .attr("y1", yScale(p.y))
          .attr("x2", xScale(p.x))
          .attr("y2", yScale(p.y))
          .attr("stroke", "#666")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 4");
      }

      // Point
      svg.append("circle")
        .attr("cx", xScale(p.x))
        .attr("cy", yScale(p.y))
        .attr("r", 4)
        .attr("fill", "#B22222")
        .attr("stroke", "white")
        .attr("stroke-width", 1);
    });

    // Function Label logic
    let labelText = "";
    if (funcType === FunctionType.LinearOrigin) labelText = `y = ${params.a}x`;
    else if (funcType === FunctionType.LinearAffine) {
        const bSign = params.b >= 0 ? '+' : '';
        labelText = `y = ${params.a}x ${bSign} ${params.b}`;
    }
    else if (funcType === FunctionType.Quadratic) labelText = `y = ${params.a}x²`;

    // Find a suitable position for the label on the graph line
    // We try to place it at ~80% of the positive visible x-range
    // We check points in densePoints to find one that is within the viewbox
    const validPoints = densePoints.map(x => {
        let y = 0;
        if (funcType === FunctionType.LinearOrigin) y = params.a * x;
        else if (funcType === FunctionType.LinearAffine) y = params.a * x + params.b;
        else if (funcType === FunctionType.Quadratic) y = params.a * x * x;
        return { x, y };
    }).filter(p => {
        const py = yScale(p.y);
        // Keep within vertical bounds + padding
        return py >= margin.top + 20 && py <= height - margin.bottom - 20;
    });

    if (validPoints.length > 0) {
        // Sort by x. For placement, we prefer the right side (positive x)
        validPoints.sort((a, b) => b.x - a.x);
        
        // Pick a point near the edge but not at the very very edge
        // Since we filtered by visibility, the first one should be the "right-most visible"
        const anchorPoint = validPoints[Math.floor(validPoints.length * 0.1)]; // 10% in from the visible edge
        
        if (anchorPoint) {
            const labelX = xScale(anchorPoint.x);
            const labelY = yScale(anchorPoint.y);

            svg.append("text")
              .attr("x", labelX + 10)
              .attr("y", labelY) 
              .attr("text-anchor", "start")
              .attr("alignment-baseline", "middle")
              .attr("font-size", "14px")
              .attr("font-weight", "bold")
              .attr("fill", "#B22222")
              .style("text-shadow", "2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff")
              .text(labelText);
        }
    }

  }, [funcType, params, points, onMount]);

  return (
    <div className="w-full flex justify-center bg-white rounded-lg border-2 border-[#8B5A2B] p-2 overflow-hidden">
      <svg 
        ref={svgRef} 
        viewBox="0 0 600 600" 
        className="w-full h-auto max-w-[500px]"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};

export default GraphPlot;