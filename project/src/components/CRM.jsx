import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, Space, Card, Typography, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons'
import { Person } from '../entities/Person'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function CRM() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPeople()
  }, [])

  const loadPeople = async () => {
    setLoading(true)
    try {
      const response = await Person.list()
      if (response.success) {
        setPeople(response.data)
      }
    } catch (error) {
      message.error('Failed to load people')
    }
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingPerson(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (person) => {
    setEditingPerson(person)
    form.setFieldsValue({
      ...person,
      birthday: person.birthday ? dayjs(person.birthday) : null
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await Person.delete(id)
      message.success('Person deleted successfully')
      loadPeople()
    } catch (error) {
      message.error('Failed to delete person')
    }
  }

  const handleSubmit = async (values) => {
    try {
      const personData = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null
      }

      if (editingPerson) {
        await Person.update(editingPerson._id, personData)
        message.success('Person updated successfully')
      } else {
        await Person.create(personData)
        message.success('Person added successfully')
      }
      
      setModalVisible(false)
      loadPeople()
    } catch (error) {
      message.error('Failed to save person')
    }
  }

  const getAge = (birthday) => {
    if (!birthday) return null
    const today = dayjs()
    const birthDate = dayjs(birthday)
    return today.diff(birthDate, 'year')
  }

  const getUpcomingBirthdays = () => {
    const today = dayjs()
    const upcoming = people.filter(person => {
      if (!person.birthday) return false
      const nextBirthday = dayjs(person.birthday).year(today.year())
      if (nextBirthday.isBefore(today)) {
        nextBirthday.add(1, 'year')
      }
      return nextBirthday.diff(today, 'day') <= 30
    }).sort((a, b) => {
      const aNext = dayjs(a.birthday).year(today.year())
      const bNext = dayjs(b.birthday).year(today.year())
      if (aNext.isBefore(today)) aNext.add(1, 'year')
      if (bNext.isBefore(today)) bNext.add(1, 'year')
      return aNext.diff(bNext)
    })
    return upcoming
  }

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center">
          <UserOutlined className="mr-2 text-blue-500" />
          <div>
            <div className="font-medium">{`${record.firstName} ${record.lastName}`}</div>
            {record.email && <div className="text-sm text-gray-500">{record.email}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Birthday',
      dataIndex: 'birthday',
      key: 'birthday',
      render: (birthday) => {
        if (!birthday) return '-'
        const age = getAge(birthday)
        return (
          <div>
            <div>{dayjs(birthday).format('MMM DD, YYYY')}</div>
            {age && <div className="text-sm text-gray-500">Age: {age}</div>}
          </div>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            className="text-blue-500"
          />
          <Popconfirm
            title="Are you sure you want to delete this person?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              className="text-red-500"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const upcomingBirthdays = getUpcomingBirthdays()

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2} className="mb-0 flex items-center">
          <UserOutlined className="mr-3 text-blue-500" />
          CRM - People & Birthdays
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          size="large"
          className="bg-blue-500 hover:bg-blue-600"
        >
          Add Person
        </Button>
      </div>

      {upcomingBirthdays.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center mb-3">
            <CalendarOutlined className="text-yellow-600 mr-2" />
            <Title level={4} className="mb-0 text-yellow-800">Upcoming Birthdays (Next 30 Days)</Title>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingBirthdays.map(person => {
              const today = dayjs()
              const nextBirthday = dayjs(person.birthday).year(today.year())
              if (nextBirthday.isBefore(today)) nextBirthday.add(1, 'year')
              const daysUntil = nextBirthday.diff(today, 'day')
              
              return (
                <div key={person._id} className="bg-white p-3 rounded border">
                  <div className="font-medium">{`${person.firstName} ${person.lastName}`}</div>
                  <div className="text-sm text-gray-600">
                    {nextBirthday.format('MMM DD')} • {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={people}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} people`,
          }}
          className="w-full"
        />
      </Card>

      <Modal
        title={editingPerson ? 'Edit Person' : 'Add New Person'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'Please enter first name' }]}
            >
              <Input placeholder="First name" />
            </Form.Item>
            
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Please enter last name' }]}
            >
              <Input placeholder="Last name" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input placeholder="Phone number" />
          </Form.Item>

          <Form.Item
            name="birthday"
            label="Birthday"
            rules={[{ required: true, message: 'Please select birthday' }]}
          >
            <DatePicker 
              className="w-full" 
              placeholder="Select birthday"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea 
              rows={3} 
              placeholder="Additional notes about this person..."
            />
          </Form.Item>

          <div className="flex justify-end space-x-2 pt-4">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="bg-blue-500 hover:bg-blue-600">
              {editingPerson ? 'Update' : 'Add'} Person
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}