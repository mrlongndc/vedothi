import React from 'react';
import { Point } from '../types';

interface ValueTableProps {
  points: Point[];
  yLabel: string;
}

const ValueTable: React.FC<ValueTableProps> = ({ points, yLabel }) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border-2 border-[#8B5A2B] bg-white shadow-md mb-6">
      <div className="bg-[#8B5A2B] text-white py-2 px-4 font-bold text-center uppercase text-sm md:text-base">
        Bảng giá trị
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-[#FFF8E1]">
              <th className="border-b-2 border-r-2 border-[#8B5A2B] p-2 text-[#8B5A2B] w-16">x</th>
              {points.map((p, i) => (
                <th key={`head-${i}`} className="border-b-2 border-[#8B5A2B] p-2 text-gray-800 min-w-[50px]">
                  {p.x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border-r-2 border-[#8B5A2B] p-2 text-[#8B5A2B] font-bold whitespace-nowrap px-4">{yLabel}</th>
              {points.map((p, i) => (
                <td key={`body-${i}`} className="p-2 text-gray-800 font-medium">
                  {parseFloat(p.y.toFixed(3))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ValueTable;