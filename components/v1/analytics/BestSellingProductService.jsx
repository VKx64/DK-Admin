"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BestSellingProductService = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold mb-4">
          Best Selling Product-Service Combos
        </h4>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-lg font-semibold mb-4">
        Best Selling Product-Service Combos
      </h4>
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Product</TableHead>
            <TableHead className="w-[50%]">Service</TableHead>
            <TableHead className="w-[10%] text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((combo, index) => (
            <TableRow key={index}>
              <TableCell className="break-words align-top">
                {combo.product}
              </TableCell>
              <TableCell className="break-words align-top">
                {combo.service}
              </TableCell>
              <TableCell className="text-right align-top">
                {combo.count}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BestSellingProductService;
