import React from 'react';
import useProductStore from '../store/productStore.js';
import { Box, Button } from '@mui/material';

const PaginationBar = () => {
  const { currentPage, modifySearch, getFilteredProducts } = useProductStore();
  const { totalPages, totalItems, entriesPerPage } = getFilteredProducts();

  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      modifySearch({ currentPage: page });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers at most

    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems="center"
      gap={2}
      sx={{
        py: 3,
        pb: 10,
        px: 4,
        backgroundColor: '#fff',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {/* Results info */}
      <div className="text-sm text-gray-600">
        Showing {(currentPage - 1) * entriesPerPage + 1} to{' '}
        {Math.min(currentPage * entriesPerPage, totalItems)} of {totalItems}{' '}
        results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outlined"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          sx={{
            minWidth: 80,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 20,
            color: currentPage === 1 ? '#bdbdbd' : '#1976d2',
            '&:hover': {
              backgroundColor: currentPage === 1 ? 'transparent' : '#e3f2fd',
            },
          }}
        >
          Previous
        </Button>

        {/* First page */}
        {pageNumbers[0] > 1 && (
          <>
            <Button
              onClick={() => handlePageChange(1)}
              sx={{
                minWidth: 40,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 20,
                fontSize: '16px',
                '&:hover': {
                  backgroundColor: '#E3F2FD',
                },
                borderColor: '#ddd',
                color: '#1976d2',
              }}
            >
              1
            </Button>
            {pageNumbers[0] > 2 && (
              <span className="px-2 text-gray-400">...</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            sx={{
              minWidth: 40,
              fontWeight: page === currentPage ? 600 : 400,
              textTransform: 'none',
              borderRadius: 20,
              fontSize: '16px',
              '&:hover': {
                backgroundColor: page === currentPage ? '#1976d2' : '#E3F2FD',
              },
              borderColor: page === currentPage ? '#1976d2' : '#ddd',
              color: page === currentPage ? '#fff' : '#1976d2',
            }}
          >
            {page}
          </Button>
        ))}

        {/* Last page */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <Button
              onClick={() => handlePageChange(totalPages)}
              sx={{
                minWidth: 40,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 20,
                fontSize: '16px',
                '&:hover': {
                  backgroundColor: '#E3F2FD',
                },
                borderColor: '#ddd',
                color: '#1976d2',
              }}
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next button */}
        <Button
          variant="outlined"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          sx={{
            minWidth: 80,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 20,
            color: currentPage === totalPages ? '#bdbdbd' : '#1976d2',
            '&:hover': {
              backgroundColor:
                currentPage === totalPages ? 'transparent' : '#e3f2fd',
            },
          }}
        >
          Next
        </Button>
      </div>
    </Box>
  );
};

export default PaginationBar;
