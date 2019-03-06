import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'
import enhanceWithClickOutside from 'react-click-outside'
import cx from 'classnames'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import ReactCountryFlag from 'react-country-flag'
import globe from '../../utils/globe.svg'
import {
  findCountryBy,
  getCountry,
  getInitialCountry,
  getCountryList,
} from '../../utils/countries-fn'

import './styles.scss'

export class PhoneInput extends Component {
  static propTypes = {
    defaultCountry: PropTypes.string,
    preferredCountries: PropTypes.arrayOf(PropTypes.string),
    regions: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    format: PropTypes.oneOf(['INTERNATIONAL', 'NATIONAL']),
    placeholder: PropTypes.string,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    defaultCountry: null,
    preferredCountries: [],
    regions: null,
    format: 'INTERNATIONAL',
    placeholder: '+1 702 123 4567',
    className: null,
    disabled: false,
  }

  constructor(props) {
    super(props)
    const {
      defaultCountry, preferredCountries, regions, format,
    } = props

    this.state = {
      country: getInitialCountry(defaultCountry, preferredCountries, regions),
      phoneNumber: format === 'INTERNATIONAL' ? getInitialCountry(defaultCountry, preferredCountries, regions).dialCode : '',
      showCountries: false,
    }

    this.phoneInput = createRef()
  }

  handleClick = code => () => {
    const country = findCountryBy('iso2', code)

    this.setState({
      country,
      phoneNumber: country.dialCode,
      showCountries: false,
    }, () => this.props.onChange(this.state.phoneNumber))

    this.phoneInput.current.focus()
  }

  toggleList = () => {
    this.setState(prevState => ({
      showCountries: !prevState.showCountries,
    }))
  }

  formatNumber = number => {
    const { format } = this.props
    const { country: { iso2 } } = this.state

    let phoneNumber = number

    if (format === 'INTERNATIONAL') {
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+${phoneNumber}`
      }
      if (phoneNumber.startsWith('+00')) {
        phoneNumber = phoneNumber.replace('00', '')
      }
    }

    const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, iso2.toUpperCase())

    try {
      phoneNumber = parsedPhoneNumber.format(format)
    } catch (e) {
      phoneNumber = phoneNumber.replace(/\(+-()\)/g, '')
    }

    return phoneNumber
  }

  handleChange = e => {
    const { value } = e.target
    const {
      defaultCountry, preferredCountries, regions, format, onChange,
    } = this.props

    if (!value.length) {
      this.setState({
        country: getInitialCountry(defaultCountry, preferredCountries, regions),
        phoneNumber: '',
      }, () => onChange(this.state.phoneNumber))

      return
    }

    if (!(/^[\d ()+-]+$/).test(value)) return

    this.setState(prevState => ({
      country: (format === 'INTERNATIONAL' && getCountry(value)) || prevState.country,
      phoneNumber: this.formatNumber(value),
    }), () => onChange(this.state.phoneNumber))
  }

  handleClickOutside() {
    this.setState({
      showCountries: false,
    })
  }

  render() {
    const { country, phoneNumber, showCountries } = this.state
    const {
      placeholder, disabled, preferredCountries, regions, format, className,
    } = this.props

    const flag = country.iso2 === 'intl'
      ? <img src={globe} alt="world" />
      : (
        <ReactCountryFlag
          code={country.iso2 || ''}
          styleProps={{
            display: 'block',
            width: '2em',
            height: '1.5em',
            backgroundPosition: 'center center',
          }}
          svg
        />
      )

    return (
      <div className={cx('phone-input', className)}>
        {
          format === 'INTERNATIONAL' && (
            <button
              onClick={this.toggleList}
              disabled={disabled}
              type="button"
            >
              {flag}
            </button>
          )
        }
        <input
          type="tel"
          value={phoneNumber}
          onChange={this.handleChange}
          ref={this.phoneInput}
          placeholder={placeholder}
          disabled={disabled}
          maxLength="21"
        />
        {
          showCountries && format === 'INTERNATIONAL' && (
            <ul className="countryList">
              {
                getCountryList(preferredCountries, regions).map(c => {
                  if (c.isAreaCode) { return null }

                  return (
                    <li
                      key={c.iso2}
                      onClick={this.handleClick(c.iso2)}
                      onKeyPress={this.handleClick(c.iso2)}
                    >
                      <ReactCountryFlag
                        styleProps={{
                          width: '20px',
                        }}
                        code={c.iso2}
                        svg
                      />
                      {` ${c.name}`}
                    </li>
                  )
                })
              }
            </ul>
          )
        }
      </div>
    )
  }
}

export default enhanceWithClickOutside(PhoneInput)
