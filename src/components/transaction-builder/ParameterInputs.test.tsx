import { fireEvent, render, screen } from '@testing-library/react';
import { ParameterInputs } from './ParameterInputs';

const AMOUNT_PARAM = { name: 'amount', type: 'uint256', value: '', required: true };

describe('ParameterInputs', () => {
  it('should convert an amount to wei without losing precision', () => {
    const onChange = vi.fn();
    render(
      <ParameterInputs
        parameters={[AMOUNT_PARAM]}
        values={['']}
        onParameterChangeAction={onChange}
        networkConfig={null}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0.123456789123456789' } });

    expect(onChange).toHaveBeenCalledWith(0, '123456789123456789');
  });

  it('should display a wei amount exactly', () => {
    render(
      <ParameterInputs
        parameters={[AMOUNT_PARAM]}
        values={['123456789123456789']}
        onParameterChangeAction={vi.fn()}
        networkConfig={null}
        amountUnit="ETH"
      />,
    );

    expect(screen.getByRole('spinbutton')).toHaveDisplayValue('0.123456789123456789');
  });

  it.each(['0.0', '-0.5'])('should pass up %s as missing rather than raw input', (input) => {
    const onChange = vi.fn();
    render(
      <ParameterInputs
        parameters={[AMOUNT_PARAM]}
        values={['']}
        onParameterChangeAction={onChange}
        networkConfig={null}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: input } });

    expect(onChange).toHaveBeenLastCalledWith(0, '');
  });

  it('should describe the amount in the given unit', () => {
    render(
      <ParameterInputs
        parameters={[AMOUNT_PARAM]}
        values={['']}
        onParameterChangeAction={vi.fn()}
        networkConfig={null}
        amountUnit="ETH"
      />,
    );

    expect(screen.getByText('Amount in ETH')).toBeInTheDocument();
  });

  it('should not pass up an amount that is not a plain decimal', () => {
    const onChange = vi.fn();
    render(
      <ParameterInputs
        parameters={[AMOUNT_PARAM]}
        values={['']}
        onParameterChangeAction={onChange}
        networkConfig={null}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1e-5' } });

    expect(onChange).toHaveBeenCalledWith(0, '');
  });
});
