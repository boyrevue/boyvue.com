import { DeleteOutlined } from '@ant-design/icons';
import { ImageProduct } from '@components/product/image-product';
import {
  Button, InputNumber, message,
  Table
} from 'antd';
import { useEffect, useRef } from 'react';
import { IProduct } from 'src/interfaces';

type IProps = {
  dataSource: IProduct[];
  rowKey: string;
  loading?: boolean;
  onChangeQuantity?: Function;
  onRemoveItemCart?: Function;
}

export function TableCart({
  dataSource,
  rowKey,
  loading = false,
  onRemoveItemCart = () => {},
  onChangeQuantity = () => {}
}: IProps) {
  const timeout = useRef(null);

  const changeQuantity = async (item, quantity: any) => {
    if (!quantity) return;
    try {
      if (timeout.current) clearTimeout(timeout.current);
      let remainQuantity = quantity;
      timeout.current = window.setTimeout(async () => {
        if (quantity > item.stock) {
          remainQuantity = item.stock;
          message.error('Quantity must not be larger than quantity in stock');
        }
        onChangeQuantity(item, remainQuantity);
      }, 300);
    } catch (error) {
      message.error('An error occurred, please try again!');
    }
  };
  const columns = [
    {
      title: '#',
      render(record) {
        return (<ImageProduct product={record} />);
      }
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render(name) {
        return (
          <div style={{
            textTransform: 'capitalize', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}
          >
            {name}
          </div>
        );
      }
    },
    {
      title: 'Price',
      dataIndex: 'price',
      render(price: number) {
        return (
          <span>
            $
            {price.toFixed(2)}
          </span>
        );
      }
    },
    // {
    //   title: 'Type',
    //   dataIndex: 'type',
    //   render(type: string) {
    //     switch (type) {
    //       case 'digital':
    //         return <Tag color="orange">Digital</Tag>;
    //       case 'physical':
    //         return <Tag color="blue">Physical</Tag>;
    //       default:
    //         break;
    //     }
    //     return <Tag color="default">{type}</Tag>;
    //   }
    // },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      render(data, record) {
        return (
          <InputNumber
            disabled={record.type === 'digital'}
            value={record.quantity || 1}
            onChange={(value) => changeQuantity(record, value)}
            type="number"
            min={1}
            max={record.stock}
          />
        );
      }
    },
    {
      title: 'Action',
      dataIndex: '',
      render(data, record) {
        return (
          <Button className="danger" onClick={() => onRemoveItemCart(record)}>
            <DeleteOutlined />
          </Button>
        );
      }
    }
  ];

  useEffect(() => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  return (
    <div className="table-responsive table-cart">
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        loading={loading}
        pagination={false}
      />
    </div>
  );
}

export default TableCart;
