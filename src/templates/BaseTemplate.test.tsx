import messages from '@/locales/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { BaseTemplate } from './BaseTemplate';

describe('Base template', () => {
  describe('Render method', () => {
    it('should have 3 menu items', () => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <BaseTemplate
            leftNav={(
              <>
                <li>link 1</li>
                <li>link 2</li>
                <li>link 3</li>
              </>
            )}
          >
            {null}
          </BaseTemplate>
        </NextIntlClientProvider>,
      );

      const menuItemList = screen.getAllByRole('listitem');

      expect(menuItemList).toHaveLength(3);
    });

    it('should display copyright info footer content', () => {
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <BaseTemplate leftNav={<li>1</li>}>{null}</BaseTemplate>
        </NextIntlClientProvider>,
      );

      const copyrightSection = screen.getByText(/©/);

      // Test for your actual footer content instead
      expect(copyrightSection).toBeInTheDocument();
    });
  });
});
